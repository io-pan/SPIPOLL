import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  StyleSheet,
  Modal,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  Dimensions,
  Slider,
  BackHandler,
} from 'react-native'

import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageViewer from 'react-native-image-zoom-viewer';
import FooterImage from './footerimage';

const backgroundColor='black',
      thumbBorderColor='black',
      thumbMarginPlusPadding = 2;

export default class ImageGallery extends Component {
  constructor (props, ctx) {
    super(props, ctx)

    this.actions = {
      slide:[
        {label:'Recadrer'},
      ],
      thumbs:[{
        label:'Annuler', 
        action: ()=>this.cancelSelectedForAction()
      },{
        label:'Supprimer', 
        action: () => this.deleteImage()
      }],
    };

    this.state = { 
      sources:this.props.sources,
                                                            // We could show thumbs to let user choose: 
      index: this.props.visible >=0 ? his.props.visible : 0,// this.props.visible,   
      view: 'slide',                                        // this.props.visible < 0 ? 'thumbs' : 'slide',      
      thumbCols:0,
      selectedForAction:false,
    }
    this.maxThumbCols = 1;
    console.log('CONST ' + this.props.visible);
  }

  thumbPress(index, long){

    if(index===false){
      this.setState({selectedForAction:false});
    }
    else if(long){
      this.setState({selectedForAction:[index]});
    }
    else{
      if(this.state.selectedForAction!==false){
        let selectedForAction = this.state.selectedForAction;
        const i = selectedForAction.indexOf(index);
        if(i<0){
          selectedForAction.push(index);
        }
        else{
          selectedForAction.splice(i, 1);
        }
        this.setState({selectedForAction:selectedForAction}); 
      }
      else{
        // TODO: ? select photo instead?
        this.gotoImage(index);
      } 
    }
  }

  selectImage(index){
    this.props.onSelect(
      index,
      this.props.sources[index].url.replace('file://'+this.props.path+'/' ,'')
    );
  }

  cancelSelectedForAction(){
    this.setState({selectedForAction:false});
  }

  deleteImage(){
    const selectedForAction = this.state.selectedForAction;

    const sources = this.props.sources;
    let selectedImageDeleted = false;
    // Backward loop to avoid re-index issue.
    for (var i = sources.length - 1; i >= 0; i--) {
      if(selectedForAction.indexOf(i) !== -1) {
        // Delete file.
        RNFetchBlob.fs.unlink(sources[i].url)
        .then(() => { 
          // console.log('photo supprimée' )
        })
        .catch((err) => {
          Alert.alert(
            'Erreur',
            'La photo n\'a pu être supprimée.\n'
            +sources[i].url
          );
        });

        // Check if selected image has been deteted.
        if( sources[i].url == 'file://' + this.props.path +'/'+ this.props.selected ){
          selectedImageDeleted = true;
        }

        // Remove from list.
        sources.splice(i, 1);
      }
    }

    // Store purged list.
    this.setState({
      selectedForAction:false,
    }, function(){
      // Inform picker.
      this.props.imageDeleted(
        sources, 
        sources.length==1 // Default select lonely remaining image...
        ? sources[0].url.replace('file://'+this.props.path+'/' ,'')
        : selectedImageDeleted ? '' : false); // ... or none.
    });
  }

  toggleView(){
    this.setState({view:this.state.view=='slide' ? 'thumbs' : 'slide'});
  }

  setIndex(index){
    this.setState({
      index:index,
    });
  }

  gotoImage(index){
    this.setState({
      view:'slide',
      index:index,
    });
  }

  renderHeader(currentIndex){
    return(
      <View 
        style={{
          height:55, flexDirection:'row', 
          justifyContent:'center', alignItems:'center',
          borderRightWidth:1, borderRightColor:'white', backgroundColor:this.props.styles.highlightColor
          }}
        >
        <TouchableOpacity 
          style={[{
            width:55,
            justifyContent:'center', alignItems:'center', 
            borderRightWidth:1, borderRightColor:'white', 
          }]}
          onPress={this.props.onCancel}
          >
          <MaterialCommunityIcons
            name="chevron-left" 
            style={[{ color:'white' }]}
            size={30}
          />
        </TouchableOpacity>

        <ScrollView horizontal={true} style={{marginLeft:10, marginRight:10}}>
          <Text style={this.props.styles.text}>
           { this.props.title }
          </Text>
        </ScrollView>

        { currentIndex === false ? null :
          <Text style={[this.props.styles.text,{
            fontWeight:'normal', paddingLeft:10,
            marginRight:this.props.sources.length > 1 ?  0 : 10,
            borderLeftWidth:1, borderLeftColor:'white', 
          }]}>
          {currentIndex+1}/{this.props.sources.length}</Text>

        }

        { this.props.sources.length > 1
        ? <TouchableOpacity 
            style={[
              currentIndex !== false ? null : {borderLeftWidth:1, borderLeftColor:'white'}, {
              width:55,
              justifyContent:'center', alignItems:'center',
            }]}
            onPress={()=> this.toggleView()}
            >
            <MaterialCommunityIcons
              name={currentIndex === false  // checkbox-multiple-blank-outline  arrange-send-backward
                ? "checkbox-multiple-blank-outline" : "view-grid" }
              style={[{ color:'white',
              }]}
              size={30}
            />
          </TouchableOpacity>
        : null
        }
      </View>
    );
  }


  onLayout(e) {
    if(!this.state.thumbCols){
      const height = e.nativeEvent.layout.height,
            width = e.nativeEvent.layout.width,
            maxThumbCols = (Math.sqrt(this.props.sources.length * width / height));

      this.width = width;
      this.maxThumbCols = Math.ceil(maxThumbCols);
      this.setState({thumbCols:this.maxThumbCols > 2 ? this.maxThumbCols-1 : this.maxThumbCols});
    }
  }

  setThumbCols(nbCols){
    this.setState({thumbCols: nbCols});
  }

  render () {
    if(!this.props.sources.length){
      return null;
    }

    console.log('render ImageGallery ' + this.props.title);

    return (
      <Modal
        onRequestClose={
          this.state.selectedForAction!==false
          ?  ()=>this.cancelSelectedForAction()
          : this.props.onCancel
        }
        visible={this.props.visible!==false}
        supportedOrientations={['portrait', 'landscape']}
        >

        <View // Slideshow
          style = {this.state.view == 'slide' ? {flex:1}:{
            // TODO: try to solve ImageViewer flickering onrender ...
            position:'absolute', bottom:-200}}>
          <ImageViewer 
            imageUrls={this.props.sources}
            index={this.state.index}
            enablePreload={true}
            renderIndicator ={()=> null}
            saveToLocalByLongPress={false}
            renderHeader={(currentIndex) => this.renderHeader(currentIndex)}
            renderFooter={() => null} // renders below screnn bottom

            onChange={(index) => this.setIndex(index)}
          />


          { // Sideshow Action buttons     
          true
          ? <View style={[this.props.styles.container,{ 
              flexDirection:'row', 
              flexDirection:'row',
              justifyContent:'center', alignItems:'center',
              borderTopWidth:1, borderTopColor:'white',
              backgroundColor:this.props.styles.highlightColor}]}
              >

              <TouchableOpacity 
                // onPress = {() => this.closeSetupMotion()}
                style={{ 
                  flex:0.5,
                  flexDirection:'row',
                  justifyContent:'center', alignItems:'center',
                  borderRightColor:'white', borderRightWidth:1,
                }}>
                <MaterialCommunityIcons   
                  name='crop-rotate'
                  size={35}
                  color='white'
                />
                <Text style={{marginLeft:10, fontWeight:'bold', color:'white', fontSize: 18 }}>
                Recadrer</Text>
              </TouchableOpacity>

             
              <TouchableOpacity 
                  onPress = {() => this.selectImage(this.state.index)}
                  style={{
                    flex:0.5,
                    flexDirection:'row',
                    justifyContent:'center', alignItems:'center',
                  }}>
                  <MaterialCommunityIcons   
                    name='delete-circle'
                    size={35}
                    color='white'
                  />
                  <Text style={{marginLeft:10, fontWeight:'bold', color:'white', fontSize: 18 }}>
                  Sélectionner</Text>
                </TouchableOpacity>
       
            </View>

          : null
        }
        </View>

        { // Thumbnails.
        this.state.view != 'thumbs' ? null :
        <View  style = {{flex:1, backgroundColor:backgroundColor}}>

          { this.renderHeader(false) }

          <ScrollView 
            onLayout = {(event) => this.onLayout(event) } 
            style={{
              flex:1,  
              // backgroundColor:this.props.styles.highlightColor
            }}
            >

            <View 
              style={{//,paddingTop:20, paddingBottom:50,
                flex:1,
                backgroundColor:backgroundColor,
                marginBottom:50,marginTop:20,
                flexDirection:'row', justifyContent:'center',
                flexWrap: 'wrap', alignItems:'flex-start',
              }}>

              { this.props.sources.map((path, index) =>
                <TouchableOpacity 
                  key={index}
                  style={{ 
                    borderWidth:1,
                    borderColor: path.url === 'file://' + this.props.path +'/'+this.props.selected
                    ? this.props.styles.highlightColor : thumbBorderColor,
                    margin:1, padding:1,
                    justifyContent:'center', alignItems:'center',
                  }}
                  onPress={()=> this.thumbPress(index, false)}  
                  onLongPress = {() => this.thumbPress(index, true)}
                  >
                  <Image 
                    style={{
                      width:this.width 
                        ? Math.ceil(this.width/this.state.thumbCols) - this.state.thumbCols*thumbMarginPlusPadding*2
                        : 0,
                      height:this.width
                        ? Math.ceil(this.width/this.state.thumbCols) - this.state.thumbCols*thumbMarginPlusPadding*2
                        : 0,
                    }}
                    resizeMode="contain"
                    source={{uri: path.url}}
                  />

                  { this.state.selectedForAction === false ? null :
                    <View style={{
                      position:'absolute', top:10, left:10,
                      borderRadius:10,
                      backgroundColor:backgroundColor,
                      height:20, width:20, borderWidth:2, borderColor:'white', padding:2, 
                    }}>
                       <View style={{
                        borderRadius:6,
                        height:12, width:12,
                        backgroundColor: this.state.selectedForAction.indexOf(index)>=0
                          ? this.props.styles.highlightColor
                          : 'transparent'
                      }}></View>
                    </View>
                  }
                </TouchableOpacity>
              )}
            </View>

            {/*
            <View style={{paddingTop:50,backgroundColor:backgroundColor}}>
              <FooterImage/>
            </View>
            */}

          </ScrollView>

          <View style={{backgroundColor:this.props.styles.highlightColor }}>
            <Slider  
              ref="sampleSize"
              style={{height:30,margin:10,backgroundColor:'transparent'}} 
              thumbTintColor = {'white'}
              minimumTrackTintColor={'white'}
              maximumTrackTintColor={'white'}
              minimumValue={-this.maxThumbCols}
              maximumValue={-1}
              step={1}
              value={-this.state.thumbCols}
              onValueChange={(value) => this.setThumbCols(-value)} 
            />
          </View>

          { // Thumbnails Action Buttons.
            this.state.selectedForAction === false ? null :
            <View style={[this.props.styles.container,{ 
              flexDirection:'row', 
                  flexDirection:'row',
                  justifyContent:'center', alignItems:'center',
              backgroundColor:this.props.styles.highlightColor}]}
              >

              { this.actions.thumbs.map((value, index) => 
                <TouchableOpacity
                  key={index}
                  style={{
                    flexDirection:'row', flex:0.5, height:50, alignItems:'center', justifyContent:'center',
                    borderRightWidth:1, borderRightColor:'white'}}
                  onPress = {value.action}
                  >
                  <MaterialCommunityIcons   
                    name='delete-circle'
                    style={{fontSize:24, paddingRight:10, color:'white'}}
                  /><Text style={{color: 'white', fontSize:16,}}>
                  {value.label}</Text>
                </TouchableOpacity>
                )
              }
            </View>
          }
        </View>
        }


      </Modal>
    )
  }
}



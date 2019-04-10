import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
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

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageViewer from 'react-native-image-zoom-viewer';
import FooterImage from './footerimage';

const backgroundColor='black',
      thumbBorderColor='black',
      thumbMarginPlusPadding = 2;

export default class ImageView extends Component {
  constructor (props, ctx) {
    super(props, ctx)

    const srcs = [];  //        
    // props.sources.forEach(function(item){ //source: {uri: this.props.failImageSource.url}
    //   srcs.push({
    //     props:{
    //       url: '',
    //       source: {uri:'file://'+props.path+'/'+item}
    //     }
    //   });
    // });

    props.sources.forEach(function(item){ //source: {uri: this.props.failImageSource.url}
      srcs.push({ url:'file://'+props.path+'/'+item });
    });

    this.actions = {
      single:[
        {label:'Recadrer'},
      ],
      multi:[
        {label:'Supprimer'},
      ],
    };

    this.state = { 
      sources:srcs,
      view:this.props.view ? this.props.view : 'slide', // slide / thumbs
      index:this.props.index,
      // Size thumbs so all photos fit in screen.
      thumbCols:0,
      selectedForAction:false,
    }
    this.maxThumbCols = 1;
  }

  // getWindowDimension(event) {
  //   // if()
  //   console.log( event.nativeEvent.layout)
  //   this.setState({
  //     w: event.nativeEvent.layout.width,
  //     h: event.nativeEvent.layout.height,
  //   });
  // }


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

  toggleView(){
    this.setState({view:this.state.view=='slide' ? 'thumbs' : 'slide'});
  }

  gotoImage(index){
    this.setState({
      view:'slide',
      index:index,
    });
  }

  renderHeader(currentIndex){
    return(
      <View style={{height:55, flexDirection:'row', 
            justifyContent:'center', alignItems:'center',
            borderRightWidth:1, borderRightColor:'white', backgroundColor:this.props.styles.highlightColor}}>
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
           { this.props.title}
          </Text>
        </ScrollView>

        { currentIndex === false ? null :
          <Text style={[this.props.styles.text,{
            fontWeight:'normal', paddingLeft:10,
            marginRight:this.state.sources.length > 1 ?  0 : 10,
            borderLeftWidth:1, borderLeftColor:'white', 
          }]}>
          {currentIndex+1}/{this.state.sources.length}</Text>

        }

        { this.state.sources.length > 1
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

  setThumbCols(nbCols){
    this.setState({thumbCols: nbCols});
  }

  onLayout(e) {
    if(!this.state.thumbCols){
      const height = e.nativeEvent.layout.height,
            width = e.nativeEvent.layout.width,
            maxThumbCols = (Math.sqrt(this.state.sources.length * width / height));

      this.width = width;
      this.maxThumbCols = Math.ceil(maxThumbCols);
      this.setState({thumbCols:this.maxThumbCols > 2 ? this.maxThumbCols-1 : this.maxThumbCols});
    }
  }

  cancelSelectedForAction(){
    this.setState({selectedForAction:false});
  }

  render () {
    return (

      <Modal
        onRequestClose={
          this.state.selectedForAction!==false
          ?  ()=>this.cancelSelectedForAction()
          : this.props.onCancel
        }
        visible={this.props.visible}
        supportedOrientations={['portrait', 'landscape']}
        >

        <View // Slideshow
          style = {this.state.view == 'slide' ? {flex:1}:{height:0}}>
          <ImageViewer 
            imageUrls={this.state.sources}
            index={this.state.index}
            enablePreload={true}
            renderIndicator ={()=> null}
            saveToLocalByLongPress={false}
            renderHeader={(currentIndex) => this.renderHeader(currentIndex)}
            renderFooter={() => null} // renders below screnn bottom

            // TODO: ImageViewer flicks on 1st render ...
            // one solution: display:none
            // onChange={(index) => {}}
          />


        { // Action buttons     
          true
          ? <View style={[this.props.styles.container,{ 
              flexDirection:'row', 
                  flexDirection:'row',
                  justifyContent:'center', alignItems:'center',
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
                  // onPress = {() => this.takeMotion()}
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

              { this.state.sources.map((path, index) =>
                <TouchableOpacity 
                  key={index}
                  style={{ 
                    borderWidth:1,
                    borderColor: this.props.selected===index 
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
            minimumValue={1}
            maximumValue={this.maxThumbCols}
            step={1}
            value={this.state.thumbCols}
            onValueChange={(value) => this.setThumbCols(value)} 
          />
          </View>

          { // Action Buttons.
            this.state.selectedForAction === false ? null :
            <View style={[this.props.styles.container,{ 
              flexDirection:'row', 
                  flexDirection:'row',
                  justifyContent:'center', alignItems:'center',
              backgroundColor:this.props.styles.highlightColor}]}
              >
              <TouchableOpacity 
                onPress = {() => this.cancelSelectedForAction()}
                style={{ 
                  flex:0.5,
                  flexDirection:'row',
                  justifyContent:'center', alignItems:'center',
                  borderRightColor:'white', borderRightWidth:1,
                }}>
                <MaterialCommunityIcons   
                  name='close-circle'
                  size={35}
                  color='white'
                />
                <Text style={{marginLeft:10, fontWeight:'bold', color:'white', fontSize: 18 }}>
                Annuler</Text>
              </TouchableOpacity>

             
              <TouchableOpacity 
                  // onPress = {() => this.takeMotion()}
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
                  Supprimer</Text>
                </TouchableOpacity>
       
            </View>
          }
        </View>
        }


      </Modal>
    )
  }
}



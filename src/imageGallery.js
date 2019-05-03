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
  Slider,
  BackHandler,
  NativeModules,
} from 'react-native'

import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageViewer from 'react-native-image-zoom-viewer';
// import ImageZoom from 'react-native-image-pan-zoom';
import ImageZoom from 'react-native-view-editor';
// import FooterImage from './footerimage';

const backgroundColor='black',
      thumbBorderColor='black',
      thumbMarginPlusPadding = 2;


//=========================================================================================
export class ModalCrop extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    this.state = {
      cropWidth:0,
      cropHeight:0,
    }

    this.crop = {
      positionX: 0, 
      positionY: 0, 
      scale: 1,
      rotation: 0,
    };

    NativeModules.ioPan.getImageSize(
      this.props.source.url.replace('file://',''),
    )
    .then((msg) => {
      console.log('getImageSize', msg);
        this.setState({
          imageWidth:msg.w,
          imageHeight:msg.h,
          landscape: msg.w > msg.h,
          imageLandscape: msg.w > msg.h,
        }, function(){
        });
    })
    .catch((err) => {
      console.log('cropImage ERROR', err);
    });
  }

  getContainerSize(e){
    const w = e.nativeEvent.layout.width,
          h = e.nativeEvent.layout.height;

    console.log('he', w*4/3);

    this.setState({
      containerWidth:w,
      containerHeight:h,
      cropWidth: w,
      cropHeight: w*4/3, // this.state.landscape ? w*3/4 : w*4/3,
    });
  }

  setLandscape(landscape){
    this.setState({
      landscape:landscape,
      // cropWidth: this.state.containerWidth,
      // cropHeight: this.state.containerWidth*4/3, // landscape ? this.state.containerWidth*3/4 : this.state.containerWidth*4/3,
    });
  }

  onChange(position, scale, rotate){
    this.crop = {
      positionX: position.x||0, 
      positionY: position.y||0, 
      scale: scale||1,
      rotation: rotate||0,
    };

    console.log(this.crop);
  }

  cropImage(copy){
    // Alert.alert(
    //   'Remplacer la photo originale ?',
    //   'Souhaitez vous remplacer par la photo originale par la photo recadrée '
    //   + 'ou garder les deux ?',
    //   [{
    //     text: 'Annuler',
    //     onPress: () => console.log('Cancel Pressed'),
    //   },{
    //     text: 'Conserver', 
    //     onPress: () => console.log('Cancel Pressed'),
    //   },{
    //     text: 'Remplacer', 
    //     onPress: () => console.log('Cancel Pressed'),
    //   }]
    // );

    let ny = (-this.crop.positionY ) +  (this.crop.scale-1)*(this.state.cropHeight/2);
    ny = ny * this.state.imageHeight/this.state.cropHeight;
    ny = ny /this.crop.scale;

    let nx = (-this.crop.positionX ) +  (this.crop.scale-1)*(this.state.cropWidth/2)
    nx = nx * this.state.imageWidth/this.state.cropWidth;
    nx = nx / this.crop.scale;

    let dest_path = this.props.source.url.replace('file://','');
    if(copy){
      dest_path = dest_path.split('.jpg');
      dest_path = dest_path[0] + '_' + new Date().getTime() + '.jpg'
    }

    NativeModules.ioPan.cropBitmap(
      this.props.source.url.replace('file://',''),
      dest_path,
      this.state.imageWidth,
      this.state.imageHeight,
      nx,
      ny,
      this.crop.rotation,
      this.crop.scale,
    )
    .then((msg) => {
      // console.log('cropImage', msg);
      this.props.imageCroped(dest_path);
      // TODO: ioio
      //  Update image picker & gallery. Shall do something like sourc.url+'?t=timestamp'

    })
    .catch((err) => {
      ALert.alert('cropImage ERROR', err);
    });

  }

  render(){
    const titleStyleLandscape = this.state.landscape 
            ? {letterSpacing:8, paddingTop:0, transform:[{ rotateZ:'90deg'}]}
            : {}, 
          titleStyle = {
            letterSpacing:0,
            fontSize:18, fontWeight:'bold', textAlign:'center', 
            color:'white'
          }
    ;

console.log(this.state)
    return(
      // Avoid loading big image while we do not need it.
      <View
        style={{flex:1}}        // visible={this.state.visible}
        // onRequestClose={() => this.hide()}
        >
             {/* <View style={{position:'absolute', top:-100, left:-300, right:0, bottom:-500, zIndex:9999}}>*/}

        <View 
          // Title bar.
          style={{
            height:55, flexDirection:'row', 
            justifyContent:'center', alignItems:'center',
            backgroundColor:this.props.styles.highlightColor,
            }}
          >
          <TouchableOpacity 
            style={[{
              height:55,
              width:55,
              justifyContent:'center', alignItems:'center', 
              borderRightWidth:1, borderRightColor:'white', 
            }]}
            onPress={(path) => //this.hide()
             this.props.imageCroped(false) }
            >
            <MaterialCommunityIcons
              name="chevron-left" 
              style={[{ color:'white' }]}
              size={30}
            />
          </TouchableOpacity>

          <View style={{flex:1, flexDirection:this.state.landscape?'row-reverse':'row', 
             alignItems:'center', justifyContent:'center',
          }}>
            <Text style={[titleStyle,titleStyleLandscape]}>
            R</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            e</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            c</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            a</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            d</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            r</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            a</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            g</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            e</Text>
            {/*
            <Text style={{ fontSize:18, fontWeight:'bold', textAlign:'center', color:'white', }}>
            Recadrer  {this.props.title ? this.props.title.replace("\n", " ") : ''} </Text>
            */}
          </View>

          <TouchableOpacity 
            style={[{
              height:55,
              width:55,
              justifyContent:'center', alignItems:'center', 
              borderRightWidth:1, borderRightColor:'white', 
            }]}
            onPress={()=> this.setLandscape(!this.state.landscape)}
            >
            <MaterialCommunityIcons
              name="phone-rotate-landscape" //{this.state.landscape ? "crop-landscape" : "crop-portrait" }
              style={[{ color:'white' }]}
              size={30}
            />
          </TouchableOpacity>
       
        </View>

        <View 
          onLayout={(event)=> this.getContainerSize(event)}
          style={{flex:1, justifyContent:'center', alignItems:'center',
            backgroundColor:backgroundColor, 
            }}>


            { !this.state.cropWidth
            ? null
            :  
              <ImageZoom
                style={{ backgroundColor:'white' }}
                checkAdjustment={false}
                imageWidth={ this.state.cropWidth }
                imageHeight={  this.state.cropHeight }

      
                imageContainerWidth={this.state.cropWidth }
                imageContainerHeight={ this.state.cropHeight }

                maskPadding={0}
                rotate={true}
                initialRotate={ this.state.landscape ? 90 : 0 }
                maxZoomScale={8}

                onChange={(position, scale, rotate)=> this.onChange(position, scale, rotate) }

                >
                <Image 
                  ref="limage"
                  style={{
                    width:!this.state.landscape 
                      ? this.state.cropWidth
                      : this.state.cropWidth*3/4
                    ,

                    height:!this.state.landscape 
                      ? this.state.cropHeight
                      : this.state.cropWidth
                    ,
                    }}
                    // resizeMode="contain"
                    source={{uri:this.props.source.url}}
                  />
                </ImageZoom>
            }

            {/*
            <View style={{backgroundColor:'red', position:'absolute', width:1,top:0,bottom:0,left:180}} />
            <View style={{backgroundColor:'red', position:'absolute', height:1,left:0,right:0,top:300}}  />
            */}
        </View>


        <View  
          style={{
            height:55,
            flexDirection:'row', alignItems:'center', justifyContent:'center',
            backgroundColor:this.props.styles.highlightColor,
            borderTopWidth:1, borderTopColor:'white',
          }}
          >         
          <TouchableOpacity 
            style={{
              flex:1,
              flexDirection:'row', height:50, alignItems:'center', justifyContent:'center',
              borderRightWidth:1, borderRightColor:'white'}}
            onPress={() => this.cropImage(false)}
            >
            <MaterialCommunityIcons
              name="check" 
              style={{fontSize:24, paddingRight:10, color:'white'}}
            /><Text style={{color:'white', fontWeight:'bold', fontSize:18,}}>
            Enregistrer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{
              flex:1,
              flexDirection:'row', height:50, alignItems:'center', justifyContent:'center',
              borderRightWidth:1, borderRightColor:'white'}}
            onPress={() => this.cropImage(true)}
            >
            <MaterialCommunityIcons
              name="content-duplicate" 
              style={{fontSize:24, paddingRight:10, color:'white'}}
            /><Text style={{color:'white', fontWeight:'bold', fontSize:18,}}>
            Copier</Text>
          </TouchableOpacity>
        {/*
        <TouchableOpacity style={{
            backgroundColor:this.props.styles.highlightColor,
            height:55, justifyContent:'center', textAlign:'center',
          }}
          onPress={(path) => this.photoPicked('close')}
          >
          <Text style={{textAlign:'center', fontSize:18, fontWeight:'bold', color:'white',}}>
          Retour à la collection</Text>
          </TouchableOpacity>
        */}

        </View>



      </View>
    );
  }
} // ModalCrop

//==================================================================================================
export default class ImageGallery extends Component {
//--------------------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx)

    this.actions = {
      slide:[{
          label:'',//Supprimer
          icon:'trash-can-outline',
          action: () => this.deleteImage()
        },{
          label:'',//Recadrer
          icon:'crop',
          action: () => this.showCropModal()
        },{
          label:'Sélectionner',
          icon:'paperclip',
          action: () => this.selectImage()
        }],

      thumbs:[{
          label:'Annuler',
          icon:'cancel',
          action: ()=>this.cancelSelectedForAction()
        },{
          label:'Supprimer', 
          icon:'trash-can-outline',
          action: () => this.deleteImage()
        }],
    };

    this.state = { 
      //sources:this.props.sources,
                                                            // We could show thumbs to let user choose: 
      index: false,
      view: 'slide',                                        // this.props.visible < 0 ? 'thumbs' : 'slide',      
      thumbCols:0,
      selectedForAction:false,

      visibleCropModal:false, 
    }
    this.maxThumbCols = 1;
    console.log('CONST ' + this.props.visible);
  }

  show(index){
    this.setState({
      index:index >=0 ? index : 0,
    })
  }

  hide(){
    if(this.state.view=='crop'){
      this.setState({view: 'slide'});
    }
    else{
      this.setState({ index:false});
    }
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
      index:index >=0 ? index : 0,
    });
  }

  showCropModal(){
    this.setState({
      view:'crop',
    }, function(){
      // this.refs['crop-modal'].show();
    })
    // this.refs['crop-modal'].show();
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
        this.gotoImage(index);
      } 
    }
  }

  selectImage(){
    this.props.onSelect(
      this.state.index,
      this.props.sources[this.state.index].url.replace('file://'+this.props.path+'/' ,'')
    );
  }

  cancelSelectedForAction(){
    this.setState({selectedForAction:false});
  }

  deleteImage(){
    const sources = this.props.sources,
          selectedForAction = this.state.selectedForAction===false
            ? [this.state.index]   // Delete single photo from slider.
            : this.state.selectedForAction
    ;

    Alert.alert(
      'Supprimer ' + selectedForAction.length + ' photo' + (selectedForAction.length>1?'s':'') +' ?',
      '',
      [
        {
          text: 'Annuler',
          onPress: () => console.log('Cancel Pressed'),
        },
        {
          text: 'Supprimer', 
          onPress: () => {

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
              index:this.state.index < sources.length-1 ? this.state.index : sources.length-1,
            }, function(){
              // Inform picker.
              this.props.imageDeleted(
                sources, 
                sources.length==1 // Default select lonely remaining image...
                ? sources[0].url.replace('file://'+this.props.path+'/' ,'')
                : selectedImageDeleted ? '' : false); // ... or none.
            });

          }
        },
      ],
    );
  }


  renderHeader(currentIndex){
    return(
      <View 
        style={{
          height:55, flexDirection:'row', 
          justifyContent:'center', alignItems:'center',
          backgroundColor:this.props.styles.highlightColor
          }}
        >
        <TouchableOpacity 
          style={[{
            height:55,
            width:55,
            justifyContent:'center', alignItems:'center', 
            borderRightWidth:1, borderRightColor:'white', 
          }]}
          onPress={()=>this.hide()}
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
            fontWeight:'normal', fontSize:16, paddingLeft:10,
            marginRight:this.props.sources.length > 1 ? 0 : 10,
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

  imageCroped(path){
    // this.setState({view: null});
    this.props.imageCroped(path);
  }

  render () {
    if(!this.props.sources.length ||this.state.index===false){
      return null;
    }

    console.log('render ImageGallery ' + this.props.title);


    return (


      <Modal
        onRequestClose={
          this.state.selectedForAction!==false
          ?  ()=>this.cancelSelectedForAction()
          :  ()=>this.hide()
        }
        visible={this.state.index!==false}
        supportedOrientations={['portrait', 'landscape']}
        >

        { this.state.view == 'slide' 
        ? // Slideshow.
          <View  style = {{flex:1, backgroundColor:backgroundColor}}>

            { this.renderHeader(this.state.index) }

            <ImageViewer 
              // backgroundColor={'white'}
              imageUrls={this.props.sources}
              index={this.state.index}
              enablePreload={true}
              renderIndicator ={()=> null}
              saveToLocalByLongPress={false}
              // renderHeader={(currentIndex) => this.renderHeader(currentIndex)}
              renderFooter={() => null} // renders below screnn bottom

              renderImage={(props) => 
                <Image  {...props} style={{...props.style, 
                    borderWidth: 
                      this.props.sources[this.state.index].url === 'file://' + this.props.path +'/'+this.props.selected
                      ? 1 : 0,
                    borderColor:this.props.styles.highlightColor,
                  }}
                />
              }

              onChange={(index) => this.setIndex(index)}
            />

            <View // Sideshow Action buttons    
              style={{ 
                height:55,
                flexDirection:'row', alignItems:'center', justifyContent:'space-around',
                backgroundColor:this.props.styles.highlightColor,
                borderTopWidth:1, borderTopColor:'white',
              }}
              >

              { this.actions.slide.map((value, index) => {
                // Do not show 'select' button if current photo is already selected.

                console.log(this.state.index);
                console.log(this.actions.slide.length);
                console.log();
                console.log();

                if(this.state.index>0
                && index==this.actions.slide.length-1
                && this.props.sources[this.state.index].url === 'file://' + this.props.path +'/'+this.props.selected){
                  return null;
                }

                return(
                  <TouchableOpacity
                    key={index}
                    style={{
                      minWidth:50,
                      flexDirection:'row', height:50, alignItems:'center', justifyContent:'center',
                      borderRightWidth:1, 
                      borderRightColor:'white'}}
                    onPress = {value.action}
                    >
                    <MaterialCommunityIcons   
                      name={value.icon}
                      style={{fontSize:24, paddingRight:10, color:'white'}}
                    /><Text style={{color: 'white', fontSize:16,}}>
                    {value.label}</Text>
                  </TouchableOpacity>
                );
              })}

            </View>
          </View>


        : this.state.view == 'thumbs' ? // Thumbnails.
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
              <View style={{ 
                  height:55,
                  flexDirection:'row', alignItems:'center', justifyContent:'center',
                  backgroundColor:this.props.styles.highlightColor,
                  borderTopWidth:1, borderTopColor:'white',
                }}
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
                      name={value.icon}
                      style={{fontSize:24, paddingRight:10, color:'white'}}
                    /><Text style={{color: 'white', fontSize:16,}}>
                    {value.label}</Text>
                  </TouchableOpacity>
                  )
                }
              </View>
            }
          </View>
        
        : // crop 


        <ModalCrop
          ref='crop-modal'
          // visible={false}
          title={this.state.index + this.props.title ? this.props.title.replace("\n", " ") : ''}
          source={this.props.sources[this.state.index]}
          styles={this.props.styles}
          imageCroped={(path)=> this.imageCroped(path)}
        />


      }


      </Modal>
    )
  }
}



const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  flex: {
    flex: 1,
  },
  maskContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mask: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    overflow: 'hidden',
  },
  topBottom: {
    height: 50,
    width: 360 - 100,
    left: 50,
  },
  top: {
    top: 0,
  },
  bottom: {
    top: 360 - 50,
  },
  side: {
    width: 50,
    height: 360,
    top: 0,
  },
  left: {
    left: 0,
  },
  right: {
    left: 360 - 50,
  },
});
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
  NativeModules,PanResponder,

} from 'react-native'

import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageViewer from 'react-native-image-zoom-viewer';
// import ImageZoom from 'react-native-image-pan-zoom';
import { ImageSized } from './widgets.js';
import FooterImage from './footerimage';

import ImageZoom from 'react-native-view-editor';


const backgroundColor='black',
      thumbBorderColor='black',
      thumbMarginPlusPadding = 2;



//=========================================================================================
export class ModalCrop extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    this.state = {
outbase64:false,

      visible:false,
      rotate:0,

      cropWidth:0,
      cropHeight:0,

    }
    this.crop = {
      positionX: 0, 
      positionY: 0, 
      scale: 1,
      rotation: 0,
    };


    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {},
      onPanResponderRelease: (evt, gestureState) => {},

      onPanResponderGrant: (evt, gestureState) => {
         console.log('ôoooooooooo');
              console.log(evt.nativeEvent.changedTouches.length);  
      console.log(gestureState.numberActiveTouches + ' ' + new Date().getTime());

        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
      },
      onPanResponderMove: (evt, gestureState) => {
     console.log(evt.nativeEvent.changedTouches.length);  
      console.log(gestureState.numberActiveTouches + ' ' + new Date().getTime());
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
    })
    console.log(this._panResponder);
  }


  show(){
    Image.getSize(
      this.props.source.url,
      (w,h) => {
        this.setState({
          visible:true, 
          rotate:0,
          imageWidth:w,
          imageHeight:h,
          landscape: w > h,
        }, function(){



        });
      }
    );
  }


  getContainerSize(e){
    const w = e.nativeEvent.layout.width,
          h = e.nativeEvent.layout.height;

    console.log(e.nativeEvent.layout.width);
    this.setState({
      containerWidth:w,
      containerHeight:h,
      cropWidth: w,
      cropHeight: w*4/3, // this.state.landscape ? w*3/4 : w*4/3,
    });
  }


  hide(){
    this.setState({visible:false});
  }

  setLandscape(landscape){
// this.setState({outbase64:!this.state.outbase64});
    // this.refs['image-zoom'].reset();
    this.setState({
      landscape:landscape,
      rotate:0,
      // cropWidth: this.state.containerWidth,
      // cropHeight: this.state.containerWidth*4/3, // landscape ? this.state.containerWidth*3/4 : this.state.containerWidth*4/3,
    });
  }

  rotate(deg){
    this.setState({rotate:deg});
  }

  onMove(IOnMove){
    //   type: string;
    //   positionX: number;
    //   positionY: number;
    //   scale: number;
    //   zoomCurrentDistance: number;
    console.log(IOnMove);
    this.crop = {
      positionX: IOnMove.positionX, 
      positionY: IOnMove.positionY, 
      scale: IOnMove.scale,
      rotation: this.state.rotate,
    };

    console.log(this.crop);
    console.log(this.state.cropWidth + ' - ' + this.state.cropHeight );
    // if(this.refs['limage']) console.log(this.refs['limage'])
  }

  cropImage(){
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

    console.log(this.crop);
    // String path, 
    // int x,
    // int y, 
    // int w,
    // int h,
    // int rotation,
    // int scale,
    NativeModules.ioPan.cropBitmap(
      this.props.source.url.replace('file://',''),
      this.crop.positionX,
      this.crop.positionY,
375,
500,

      this.crop.rotation,
      this.crop.scale,

    )
    .then((msg) => {

      this.setState({motionBase64:msg.motionBase64});
          console.log(msg);


    
    })
    .catch((err) => {
      console.log(err);
      // Alert.alert(
      //   'Erreur',
      //   'La photo n\'a pu être supprimée.\n'
      //   +sources[i].url
      // );
    });

  }

Mask() {
  return (
    <View style={styles.maskContainer}>
      <View style={[styles.mask, styles.topBottom, styles.top]} />
      <View style={[styles.mask, styles.topBottom, styles.bottom]} />
      <View style={[styles.mask, styles.side, styles.left]} />
      <View style={[styles.mask, styles.side, styles.right]} />
    </View>
  )
}
  render(){
    const titleStyleLandscape = this.state.landscape 
            ? {letterSpacing:8, paddingTop:0, transform:[{ rotateZ:'90deg'}]}
            : {}, 
          titleStyle = {
            letterSpacing:3,
            fontSize:18, fontWeight:'bold', textAlign:'center', 
            color:'white'
          }
    ;

const PIrad = Math.PI / 180;
  let rad = this.state.rotate * Math.PI / 180,
      
        dx =   -  this.crop.positionX/ this.crop.scale;
        dy =   -  this.crop.positionY/ this.crop.scale;


        // dx = -100;
        // dy = 60;


        tx = Math.cos(rad) * dx - Math.sin(rad) * dy,
        ty = Math.sin(rad) * dx + Math.cos(rad) * dy;

// tx = Math.cos(( this.state.rotate) * PIrad) * dx 
//       + Math.sin((360 - this.state.rotate) * PIrad) * dy
//     ;

// ty =  Math.sin(( this.state.rotate)  * PIrad) * dx 
//     + Math.cos(( this.state.rotate) * PIrad) * dy
//     ;

console.log( this.state.rotate + ' ' + ty);

    return(
      !this.state.visible ? null:

      <Modal
        visible={this.state.visible}
        onRequestClose={() => this.hide()}>
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
            onPress={(path) => this.hide()}
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
            E</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            C</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            A</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            D</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            R</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            E</Text>
            <Text style={[titleStyle,titleStyleLandscape]}>
            R</Text>
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


  {this.state.outbase64
  ? <Image 
          style={{
                   
                    width:  this.state.cropWidth  ,
                    height: this.state.cropHeight,
              }}
                    resizeMode='contain'
        source={{uri: 'data:image/png;base64,' + this.state.motionBase64}}
            />


  :
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

                onChange={(position, scale, rotate)=> {
                  // console.log('------------------------------- collback')
                  // console.log(position)
                  // console.log(scale)
                  // console.log(rotate)
                }}

                >
                <Image 
                  ref="limage"
                  style={{
                    transform:[
                      // { translateX: tx},
                      // { translateY: ty},
                      { rotateZ: ((this.state.landscape?90:0) + this.state.rotate) +'deg'},
                    ],

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

              /*
              ? null
              : <ImageZoom 
                  ref="image-zoom"
                  style={{backgroundColor:'blue', 

                  onMove={(IOnMove)=>this.onMove(IOnMove)}
                  cropWidth={this.state.cropWidth}
                  cropHeight={this.state.cropHeight}

                  imageWidth={
                    this.state.landscape 
                    ? this.state.cropHeight 
                    : this.state.cropWidth
                  }

                  imageHeight={
                    this.state.landscape 
                    ? this.state.imageHeight> this.state.imageWidth 
                      ? this.state.cropHeight  // img prt
                      : this.state.cropHeight //*  this.state.imageWidth / this.state.imageHeight
                    : this.state.cropHeight
                  }
                  >
                  <Image 
                  ref="limage"
                  style={{
 

                    top:
                      this.state.landscape 
                      ? this.state.cropHeight/2-this.state.cropWidth/2
                      : 0
                    ,
                    width:
                      this.state.landscape 
                      ? this.state.cropHeight
                      : this.state.cropWidth
                    ,
                    height:
                      this.state.landscape
                      ? this.state.imageHeight> this.state.imageWidth // img prt
                        ? this.state.cropWidth
                        : this.state.cropWidth//*  this.state.imageWidth / this.state.imageHeight
                      : this.state.cropHeight
                      ,

                    }}
                    source={{uri:this.props.source.url}}
                  />
                </ImageZoom>
*/
            }

   {/*       <ImageSized
            resizeMode="contain"
            source={{uri:this.props.source.url}}
          />*/}


<View style={{backgroundColor:'red', position:'absolute', width:1,top:0,bottom:0,left:180}} />
<View style={{backgroundColor:'red', position:'absolute', height:1,left:0,right:0,top:300}}  />

        </View>

}

        <View style={{flexDirection:'row', backgroundColor:this.props.styles.highlightColor }}>
           


          <TouchableOpacity 
            style={[{
              height:55,
              width:55,
              justifyContent:'center', alignItems:'center', 
              borderRightWidth:1, borderRightColor:'white', 
            }]}
            onPress={() => this.cropImage()}
            >
            <MaterialCommunityIcons
              name="crop" 
              style={[{ color:'white' }]}
              size={30}
            />
          </TouchableOpacity>

            <Slider  
              ref="sampleSize"
              style={{flex:1, height:30,margin:10,backgroundColor:'transparent'}} 
              thumbTintColor = {'white'}
              minimumTrackTintColor={'white'}
              maximumTrackTintColor={'white'}
              minimumValue={ -180 }
              maximumValue={ 180 }
              step={1}
              value={ this.state.rotate }
              onValueChange={(value) => this.rotate(value)} 
            />
          </View>


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
      </Modal>
    );
  }
} // ModalCrop

//==================================================================================================
export default class ImageGallery extends Component {
//--------------------------------------------------------------------------------------------------
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
      index: this.props.visible >=0 ? this.props.visible : 0,// this.props.visible,   
      view: 'slide',                                        // this.props.visible < 0 ? 'thumbs' : 'slide',      
      thumbCols:0,
      selectedForAction:false,

      visibleCropModal:false, 
    }
    this.maxThumbCols = 1;
    console.log('CONST ' + this.props.visible);
  }

  showCropModal(){
    this.setState({visibleCropModal:true},
      function(){
        this.refs['crop-modal'].show();
      })
  }
  // hideCropModal(){
  //   this.refs['crop-modal'].hide());
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
            fontWeight:'normal', fontSize:16, paddingLeft:10,
            marginRight:0,
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
      this.state.visibleCropModal 
      ?
      <ModalCrop
          ref='crop-modal'
          visible={this.state.visibleCropModal}
          title={this.state.index + this.props.title ? this.props.title.replace("\n", " ") : ''}
          source={this.props.sources[this.state.index]}
          styles={this.props.styles}
        />

      : //this.props.visible===false?null:

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
                onPress = {() => this.showCropModal()}
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
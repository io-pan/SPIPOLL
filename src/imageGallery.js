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
      this.props.source.url.split('?')[0].replace('file://',''),
    )
    .then((msg) => {
      console.log('getImageSize', msg);
        this.setState({
          imageWidth:msg.w,
          imageHeight:msg.h,
          viewLandscape: msg.w > msg.h,
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

    this.setState({
      containerWidth:w,
      containerHeight:h,
      cropWidth: w,
      cropHeight: w*4/3,
    });
  }

  setLandscape(landscape){
    this.setState({
      viewLandscape:landscape,
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

    // Give java real rectange info (x, y, w, h) 
    // instead of orignial x y (based on center of view).
    const src_path = this.props.source.url.split('?')[0].replace('file://',''),
          dest_path = copy
            ? src_path.split('.jpg')[0] + '_' + new Date().getTime() + '.jpg'
            : src_path,
          src_w = this.state.imageWidth,
          src_h = this.state.imageHeight,
          scale = this.crop.scale;

    let nx, ny,
        rotation = this.crop.rotation,
        switch_oriantation = 0;

    // Portrait image
    if(!this.state.imageLandscape){
      ny = (-this.crop.positionY ) +  (scale-1)*(this.state.cropHeight/2);
      ny = ny * src_h/this.state.cropHeight;
      ny = ny /scale;
  
      nx = (-this.crop.positionX ) +  (scale-1)*(this.state.cropWidth/2)
      nx = nx * src_w/this.state.cropWidth;
      nx = nx / scale;

      // landscape view (swich)
      if(this.state.viewLandscape){
        rotation += 90;
        switch_oriantation = -90;
      }
    }

    // Landscape Image
    else{
      nx = (-this.crop.positionY ) +  (scale-1)*(this.state.cropHeight/2);
      nx = nx * src_w/this.state.cropHeight;
      nx = nx /scale;
  
      ny = (+this.crop.positionX ) +  (scale-1)*(this.state.cropWidth/2)
      ny = ny * src_h/this.state.cropWidth;
      ny = ny / scale;

      // Portrait view (swich)
      if(!this.state.viewLandscape){
        rotation -= 90;
        switch_oriantation = 90;
      }
    }

    NativeModules.ioPan.cropBitmap(
      src_path,
      dest_path,
      src_w,
      src_h,
      nx,
      ny,
      rotation,
      this.crop.scale,
      switch_oriantation
    )
    .then((msg) => {
      // console.log('cropImage', msg);
      if(!msg['999 error ']){
        // refresh widget.
        this.props.imageCroped(dest_path);
      }

    })
    .catch((err) => {
      console.log('ERROR CROP', err)
      // Alert.alert('cropImage ERROR', err);
    });

  }

  render(){
    const titleStyleLandscape = this.state.viewLandscape 
            ? {letterSpacing:8, paddingTop:0, transform:[{ rotateZ:'90deg'}]}
            : {}, 
          titleStyle = {
            letterSpacing:0,
            fontSize:18, fontWeight:'bold', textAlign:'center', 
            color:'white'
          }
    ;

    // console.log('render ModalCrop', this.state)

// TODO: when deleting a photo and next has a diffrent w/h ratio

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
            onPress={(path) => this.props.imageCroped(false)}
            >
            <MaterialCommunityIcons
              name="chevron-left" 
              style={[{ color:'white' }]}
              size={30}
            />
          </TouchableOpacity>

          <View style={{flex:1, flexDirection:this.state.viewLandscape?'row-reverse':'row', 
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
          </View>

          <TouchableOpacity 
            style={[{
              height:55,
              width:55,
              justifyContent:'center', alignItems:'center', 
              borderRightWidth:1, borderRightColor:'white', 
            }]}
            onPress={()=> this.setLandscape(!this.state.viewLandscape)}
            >
            <MaterialCommunityIcons
              name="phone-rotate-landscape"
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
            : <ImageZoom
                style={{ backgroundColor:'white' }}
                checkAdjustment={false}
                maxZoomScale={8}

                imageWidth={ this.state.cropHeight }
                imageHeight={ this.state.cropHeight }

                imageContainerWidth={ this.state.cropHeight  }
                imageContainerHeight={ this.state.cropHeight }

                rotate={true}
                initialRotate={
                  ((this.state.viewLandscape && this.state.imageLandscape)  
                  || (this.state.viewLandscape && !this.state.imageLandscape)) ? 90 : 0 }

                onChange={(position, scale, rotate)=> this.onChange(position, scale, rotate) }
                >
                <Image 
                  ref="limage"
                  style={{
                    // borderColor:'blue', borderWidth:1,
                    width:!this.state.imageLandscape 
                      ? this.state.cropWidth
                      : this.state.cropHeight 
                    ,
                    height:!this.state.imageLandscape 
                      ? this.state.cropHeight
                      : this.state.cropWidth 
                    ,
                  }}
                  source={{uri:this.props.source.url + '?t=' + new Date().getTime()}}
                />
              </ImageZoom>
            }

            {/*            
            <View style={{backgroundColor:'red', position:'absolute', width:1,top:0,bottom:0,left:180}} />
            <View style={{backgroundColor:'red', position:'absolute', height:1,left:0,right:0,top:300}} />
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
          condition:true,
          label:'Supprimer',
          icon:'trash-can-outline',
          action: () => this.deleteImage()
        },{
          condition:this.props.extractPhotos,
          label:'Extraire',
          icon:'image-move',
          action: () => this.moveImage(),
        },
        // {
        //   label:'Recadrer',
        //   icon:'crop',
        //   action: () => this.showCropModal()
        // },
        // {
        //   label:'Sélectionner',
        //   icon:'paperclip',
        //   action: () => this.selectImage()
        // }
        ],

      thumbs:[
        // {
        //   label:'Annuler',
        //   icon:'cancel',
        //   action: ()=>this.cancelSelectedForAction()
        // },
        {
          label:'Supprimer', 
          icon:'trash-can-outline',
          action: () => this.deleteImage()
        },{
          condition:this.props.extractPhotos,
          label:'Extraire',
          icon:'image-move',
          action: () => this.moveImage(),
        }]
    };

    this.state = { 
      //sources:this.props.sources,
      index: false,
      view: 'slide',    
      thumbCols:0,
      selectedForAction:false,
    }
    this.maxThumbCols = 1;
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
    console.log('gotoImage', index)
    this.setState({
      view:'slide',
      index:index >=0 ? index : 0,
    });
  }

  showCropModal(visible){
    this.setState({
      view:visible ? 'crop':'slide',
    }, function(){
      // this.refs['crop-modal'].show();
    })
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
      this.props.sources[this.state.index].url.split('?')[0].replace('file://'+this.props.path+'/' ,'')
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
                RNFetchBlob.fs.unlink(sources[i].url.split('?')[0])
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
                if( this.props.selected 
                &&  sources[i].url.split('?')[0].indexOf(this.props.path +'/'+ this.props.selected) > 0 ){
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

  moveImage(){
    // user might have taken a photo that is not from the expected kind
    //  => create new kind or move photo to another kind.
    
    const sources = this.props.sources,
          selectedForAction = this.state.selectedForAction===false
            ? [this.state.index]   // Delete single photo from slider.
            : this.state.selectedForAction
    ;

    let selectedImageDeleted = false;
    for(i=0; i<selectedForAction.length; i++){
      // Check if selected image has been deteted.
      if( this.props.selected 
      &&  sources[selectedForAction[i]].url.split('?')[0].indexOf(this.props.path +'/'+ this.props.selected) > 0 ){
        selectedImageDeleted = true;
      }

      selectedForAction[i] = sources[selectedForAction[i]];
    }


    Alert.alert(
      'Extraire ' + selectedForAction.length + ' photo' + (selectedForAction.length>1?'s':'') +' ?',
     
      "Si l'insecte sur la photo n'est pas de la bonne espèce, vous pouvez extraire la photo. "
      + "Ceci aura pour effet de créer une nouvelle espèce d'insecte et d'y inclure la photo.\n"
      + "Si l'insecte appartient à une espèce déjà présente dans la liste, vous pourrez fusionner "
      + "les deux espèces en faisant une touche longue sur la liste.",
      [
        {
          text: 'Retour',
          // onPress: () => console.log('Cancel Pressed'),
        },
        {
          text: 'Extraire la photo', 
          onPress: () =>{
         
            this.props.extractPhotos(
              selectedForAction, 
              selectedImageDeleted
            );
          },
        }
      ]
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



  render () {
    if(!this.props.sources.length || this.state.index===false){
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
              renderFooter={() => null} // renders below screen bottom
              // renderImage={(props) => 
              //   <View
              //     style={{...props.style,
              //       borderTopWidth: 
              //         this.props.selected
              //         && this.state.index!==false && this.props.sources[this.state.index]
              //         && this.props.sources[this.state.index].url.split('?')[0].indexOf(this.props.path +'/'+this.props.selected)>0
              //         ? 2 : 0,
              //       borderColor:this.props.styles.highlightColor,
              //     }}
              //     >
              //     {this.props.selected
              //         && this.state.index!==false && this.props.sources[this.state.index]
              //         && this.props.sources[this.state.index].url.split('?')[0].indexOf(this.props.path +'/'+this.props.selected)>0
              //       ? <Text style={{color:'white', textAlign:'center', paddingBottom:10,}}>Sélectionnée</Text>
              //       :null
              //     }
                 
              //     <Image  {...props} />
              //   </View>
              // }

              onChange={(index) => this.setIndex(index)}
            />

            <View // Sideshow Action buttons    
              style={{ 
                height:55,
                flexDirection:'row', alignItems:'center', justifyContent:'flex-start',
                backgroundColor:this.props.styles.highlightColor,
                borderTopWidth:1, borderTopColor:'white',
              }}
              >

              { this.actions.slide.map((value, index) => {
                if(typeof value.condition !='undefined' &&  !value.condition){
                 return null;
                }

                return(
                  <TouchableOpacity
                    key={index}
                    style={{
                      width:55,
                      flexDirection:'row', height:50, alignItems:'center', justifyContent:'center',
                      borderRightWidth:1, 
                      borderRightColor:'white'}}
                    onPress = {value.action}
                    >
                    <MaterialCommunityIcons   
                      name={value.icon}
                      style={{fontSize:24, color:'white'}}
                    />
                    {/*<Text style={{color: 'white', fontSize:16,}}>{value.label}</Text>*/}
                  </TouchableOpacity>
                );  
              })}

              { //show small 'CROP' and big 'SELECT' button if current photo is not already selected.
              !this.props.selected || 
              this.props.sources[this.state.index].url.split('?')[0].indexOf(this.props.path +'/'+this.props.selected) < 0 
              ? <React.Fragment>
                  <TouchableOpacity
                    style={{
                      width:55,
                      flexDirection:'row', height:50, alignItems:'center', justifyContent:'center',
                      borderRightWidth:1, 
                      borderRightColor:'white'}}
                    onPress = {() =>  this.showCropModal(true)}
                    >
                    <MaterialCommunityIcons   
                      name='crop'
                      style={{fontSize:24, color:'white'}}
                    />
                    {/*<Text style={{color: 'white', fontSize:16,}}>{value.label}</Text>*/}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex:1,
                      flexDirection:'row', height:50, alignItems:'center', justifyContent:'center',
                      borderRightWidth:1, 
                      borderRightColor:'white'}}
                    onPress =  {() => this.selectImage()}
                    >
                    <MaterialCommunityIcons   
                      name="paperclip"
                      style={{fontSize:24, paddingRight:10, color:'white'}}
                    /><Text style={{color: 'white', fontSize:16,}}>
                    Sélectionner</Text>
                  </TouchableOpacity>
                </React.Fragment>
              : //show big 'CROP' button if current photo already selected.
                <TouchableOpacity
                  style={{
                    flex:1,
                    flexDirection:'row', height:50, alignItems:'center', justifyContent:'center',
                    borderRightWidth:1, 
                    borderRightColor:'white'}}
                  onPress =  {() =>  this.showCropModal(true)}
                  >
                  <MaterialCommunityIcons   
                    name="crop"
                    style={{fontSize:24, paddingRight:10, color:'white'}}
                  /><Text style={{color: 'white', fontSize:16,}}>
                  Recadrer</Text>
                </TouchableOpacity>
              }

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
                      borderColor: this.props.selected && path.url.indexOf(this.props.path +'/'+this.props.selected) > 0
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

                { this.actions.thumbs.map((value, index) => {
                  if(typeof value.condition !='undefined' &&  !value.condition){
                   return null;
                  }
                  return(
                    <TouchableOpacity
                      key={index}
                      style={{
                        flexDirection:'row', flex:1, height:50, alignItems:'center', justifyContent:'center',
                        borderRightWidth:1, borderRightColor:'white'}}
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
            }
          </View>
        
        : // crop 
          <ModalCrop
            ref='crop-modal'
            // visible={false}
            title={this.state.index + this.props.title ? this.props.title.replace("\n", " ") : ''}
            source={this.props.sources[this.state.index]}
            styles={this.props.styles}
            imageCroped={(path)=> path ? this.props.imageCroped(path) : this.showCropModal(false) }
          />

      }
      </Modal>
    )
  }
}



const styles = StyleSheet.create({

});
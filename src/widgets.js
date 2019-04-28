import React, { Component } from 'react'
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  Dimensions,
  ScrollView,
  Modal,
  NativeModules,
} from 'react-native'

import RNFetchBlob from 'rn-fetch-blob';
import ImageViewer from 'react-native-image-zoom-viewer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView from 'react-native-maps';

import FooterImage from './footerimage';
import ImageGallery from './imageGallery';
import Cam from './cam';
import { dmsFormat, deg2dms, pad2 } from './formatHelpers.js';

// TODO:  Add locationSelect and others
//        ... at least take it out of CollectionForm.


//=========================================================================================
export class Form extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    // TODO: 
    // use state and localstore here, so container would not have to render. 
    // this.state = this.props.currentValues
  }

  makeMultiSelect(field, value){
    // Multiselect.
    let array = this.props.currentValues[field];
    var index = array.indexOf(value);
    if (index !== -1) {
      array.splice(index, 1);
    }
    else{
      array.push(value);
    }
    return array;
  }

  render(){
    return (
      this.props.fields.map((field, index) => 
        <View key={index} style={this.props.styles.group}>
          
          <Text style={[this.props.styles.title, 
            ((field.type=='singleSelect' 
                && !(this.props.currentValues[field.name] || this.props.currentValues[field.name] === 0))

            || (field.type=='multiSelect'  
                && this.props.currentValues[field.name].length==0)
            ) 
              ? {color:this.props.styles.badColor}
              : {}
          ]}>

          {field.title}</Text>
          
          { field.type=='int'

          ? <View 
              style={{
                flexDirection:'row',
                alignItems:'space-between',
                justifyContent:'center',
                 // alignItems: 'flex-start',
              }}>
              <TextInput
                keyboardType="number-pad"
                style={[
                  this.props.styles.label,
                  { 
                    width:60, padding:0,
                    textAlign:'center',             
                    color: this.props.styles.highlightColor,
                   }
                ]}
                defaultValue={this.props.currentValues[field.name] ? this.props.currentValues[field.name]+'' : ''}
                onEndEditing = {(event) => this.props.fieldChanged(field.name, isNaN(parseInt(event.nativeEvent.text),10) 
                  ? '' : parseInt(event.nativeEvent.text),10)} 
                onSubmitEditing = {(event) => this.props.fieldChanged(field.name, isNaN(parseInt(event.nativeEvent.text),10) 
                  ? '' : parseInt(event.nativeEvent.text),10)}               
              />
            </View>

          : field.type=='singleSelect' || field.type=='multiSelect'
          ? <View 
              style={{flexDirection:'row', justifyContent:'center',
              flexWrap: 'wrap', alignItems:'flex-start'}}>
              { field.values.map((value, value_index) => 
                <TouchableOpacity
                  key={field.title+'_'+value.value}
                  style={this.props.styles.label}
                  onPress = { field.type=='singleSelect'
                    ? () => this.props.fieldChanged(field.name, 
                        this.props.currentValues[field.name]==value.value ? '' : value.value)
                    : () => this.props.fieldChanged(field.name, this.makeMultiSelect(field.name, value.value))
                  }
                  >
                  <Text style={[this.props.styles.labelText,{
                    color: field.type=='singleSelect' 
                    ? this.props.currentValues[field.name]==value.value ? this.props.styles.highlightColor : 'grey'
                    : this.props.currentValues[field.name].indexOf(value.value)!==-1 ? this.props.styles.highlightColor : 'grey'
                    }]}>
                  {value.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          : null
          }
        </View>
      )
    );
  }
}


//=========================================================================================
export class ModalPlace extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);

    console.log('ModalPlace');
     console.log(props);
    this.state = {
      visible: this.props.visible,
                                              //46.7235477,2.4466963
      name: this.props.name?''+this.props.name:'',
      lat: this.props.lat?this.props.lat:46.7235477,
      lon: this.props.lon?this.props.lon:2.4466963,

      region:{
        latitude: this.props.lat?this.props.lat:46.7235477,
        longitude: this.props.lon?this.props.lon:2.4466963,
        latitudeDelta: 8,
        longitudeDelta: 8,
      },
    }    

    this.makeCancelable = (promise) => {
      let hasCanceled_ = false;
      const wrappedPromise = new Promise((resolve, reject) => {
        promise.then(
          val => hasCanceled_ ? reject({isCanceled: true}) : resolve(val),
          error => hasCanceled_ ? reject({isCanceled: true}) : reject(error)
        );
      });
      return {
        promise: wrappedPromise,
        cancel() {
          hasCanceled_ = true;
        },
      };
    };
    this.geocodeAddressPromise = false;
  }

  onSearchInput(text) {
    if (text) {
      NativeModules.ioPan.getLocationCoord(text)
      .then((coord) => {
        this.setState({ 
          name: text,
          lat: coord.lat,
          lon: coord.lng,
        }, function(){
          // update map.
          this.refs.lamap.animateToRegion({
            latitude:coord.lat,
            longitude:coord.lng,
            latitudeDelta:0.002,
            longitudeDelta:0.002,
          });
        });
      })          
      .catch((error) => { 
        // console.log(error);
        this.setState({ 
          name: 'Lieu inconnu',
        })
      }); 
    }
  }

  onRegionChangeComplete(region) {
   
      // Get place name
      NativeModules.ioPan.getLocationName(region.latitude, region.longitude)
      .then((ville) => {
          this.setState({ 
            name: ville,
            lat: region.latitude,
            lon: region.longitude,
          }, function(){
            // this.storeListItem('place', { 
            //   ...this.state.collection.place,
            //   name: ville,
            //   lat:region.latitude,
            //   long:region.longitude, 
            // });
          });
      })          
      .catch((error) => { 
          this.setState({ 
            name: 'Lieu inconnu',
            lat: region.latitude,
            lon: region.longitude,
          }, function(){
            // this.storeListItem('place', { 
            //   ...this.state.collection.place,
            //   name: 'Lieu inconnu',
            //   lat:region.latitude,
            //   long:region.longitude, 
            // });
          });
      }); 
    
  }

  textLayout(){
    if(!this.props.lat||!this.props.lon){
      this.refs.searchText.focus(); 
    }
  }

  sendData = () => {
    this.props.onCancel({lat:this.state.lat,long:this.state.lon, name:this.state.name});
  }

  render() {
    return (
      <Modal
        onRequestClose={this.sendData}
        visible={this.props.visible}
      >
        <View style={{flex:1}} >

          <Text style={{ textAlign:'center',
            backgroundColor:this.props.highlightColor, paddingTop:30,paddingBottom:20, 
            color:'white', fontWeight:'bold', fontSize:18,
          }}>
          {this.props.title}
          </Text>
          <MaterialCommunityIcons.Button   
            name="magnify"
            backgroundColor={this.props.highlightColor}
            size={30}
            style={{marginLeft:5, marginBottom:20}}
          >
            <TextInput
              onLayout = {(event) => this.textLayout() } 
              autofocus={true}
              underlineColorAndroid='transparent'
              ref='searchText'
              style={{ 
                backgroundColor:'white', 
                flex:1,
                margin:0, 
                marginRight:20,
                padding:3,
              }}
              onEndEditing =    {(event) => this.onSearchInput( event.nativeEvent.text) } 
              onSubmitEditing = {(event) => this.onSearchInput( event.nativeEvent.text) } 
            />
          </MaterialCommunityIcons.Button>

          <View style={{
              height:Dimensions.get('window').width,
              width:Dimensions.get('window').width,
            }}>
    
            <MapView
              ref="lamap"
              style={{
                height:Dimensions.get('window').width,
                width:Dimensions.get('window').width,
              }}
              mapType="hybrid"
              initialRegion={{
                latitude: this.props.lat?this.props.lat:46.7235477,
                longitude: this.props.lon?this.props.lon:2.4466963,
                latitudeDelta: this.props.lat&&this.props.lat?0.002:8,
                longitudeDelta: this.props.lat&&this.props.lat?0.002:8,
              }} 
              onRegionChangeComplete = { (region) => this.onRegionChangeComplete(region) } 
            />
            <View style={styles.target_h}  ></View>
            <View style={styles.target_v}  ></View>
          </View>

          <View style={{flex:1, alignItems:'center'}}>

            <Text style={{fontSize:16}}>{this.state.name}</Text>

            <View style={{flexDirection:'row', alignItems:'space-between' // TODO: try space-around
              }}>
             
              <Text style={{fontSize:16, marginRight:5,
                color:'grey'
                }}
                >
                { dmsFormat(deg2dms(this.state.lat, 'lat')) + '   ' + dmsFormat(deg2dms(this.state.lon, 'lon')) }
              </Text>
              <Text style={{fontSize:16}}> </Text>
            </View> 

          </View> 

          <View style={{flexDirection:'row'}}>
            <TouchableOpacity
              style={{flex:1,backgroundColor:this.props.highlightColor, borderRightWidth:1, borderRightColor:'white'}}
              onPress={this.sendData}
              ><Text style={{textAlign:'center', padding:10,fontWeight:'bold', fontSize:16, color:'white'}}>
              OK</Text>
            </TouchableOpacity>
          
          </View>
        </View>
      </Modal>
    )
  }
}


//=========================================================================================
export class ImageSlider extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);

    this.state = {
      sources:[],
    };
  }

  componentWillMount(){
    if(this.props.path){
        RNFetchBlob.fs.ls(this.props.path)
        .then((files) => this.setState({ sources:files }) )
    }
  }

  render(){
    return this.state.sources.map((path, index) => 
      <TouchableOpacity
        key={index} 
        onPress={() => this.props.onPress(index)}
        >
        <Image 
          key={index}
          style={{
            marginRight:1,
            width:50,//this.state.width/5,
            height:50,//this.state.width/5,
          }}
          resizeMode="contain"
          source={{uri:'file://'+this.props.path+'/'+path}}
        />
      </TouchableOpacity>
    );
  }
}


//=========================================================================================
export class ImagePicker extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);

    this.state = {
      visibleCamera:false,
      bigGalleryIndex:false,
      count:0,
      sources:[],
    }
  }

  componentDidMount(){
    // setTimeout(()=>{
    //   alert(this.state.filename);
    //   this.setState({index:0})
    // }, 2000);
    this.checkFolder();
  }

  checkFolder(){
    if(this.props.path){
      RNFetchBlob.fs.isDir(this.props.path)
      .then((isDir) => {
        if(false === isDir){
          RNFetchBlob.fs.mkdir(this.props.path)
          .then(() => { 
            this.scanFolder();
          })
          .catch((err) => { 
            Alert.alert(
              'Erreur',
              'Le dossier de stockage des photos n\'a pu être créé.\n'
              + this.props.path
            );
          })
        }
        else{
          this.scanFolder();
        }
      });
    }
  }

  scanFolder(){
    RNFetchBlob.fs.ls(this.props.path)
    .then((files) => {

      if(files.length){
        files.sort();
        const sources = [],
              index = files.indexOf(this.props.filename);

        files.forEach((filename)=> {
          sources.push({ url:'file://' + this.props.path +'/'+ filename });
        });

        this.setState({
          index: index!=-1 ? index : 0,
          sources:sources,
        });
      }

    });  
  }

  showImageGallery = (index) => {
    this.setState({
      bigGalleryIndex:index,
      // visibleCamera:false, // Do not close cam since we can open gallery from cam modal
    });
  }

  hideImageGallery = () => {
    this.setState({bigGalleryIndex: false});
  }

  showCam(){
    this.nbTakenPhoto = 0;
    this.setState({
      visibleCamera:true,
      bigGalleryIndex:false,
    })
  }

  photoPicked(path){
    if(path=='close'){

      // If only one photo, selected it.
      if(this.state.sources.length == 1){
        console.log('onephoto',this.state.sources[0].url.replace('file://' + this.props.path,''))
        console.log(this.props.path);
         console.log(this.state.sources[0].url);
        this.props.onSelect(this.state.sources[0].url.replace('file://' + this.props.path,''));
      }
      
      // Show gallery so user can see what he picked... 
      // TODO : keep this ?
      this.setState({
        visibleCamera:false,
        bigGalleryIndex: this.nbTakenPhoto 
          ? this.state.sources.length-1
          : false, // ...unless he came back but did not take any photo.
      });

    }
    else{
      this.nbTakenPhoto++;
      const sources = this.state.sources;
      sources.push({ url:'file://' + path });

      this.setState({sources:sources});
    }
  }


  imageSelected(index, filename) {
    this.setState({index:index});
    this.props.onSelect(filename);
  }

  imageDeleted(sources, newSelectedImage){
    let index = this.state.index;
    if(newSelectedImage!==false){
      index = 0;
      this.props.onSelect(newSelectedImage);
    }
    this.setState({
      sources:sources,
      index:index,
      bigGalleryIndex:sources.length ? sources.length-1 : false,
    });
  }

  setIndex(index){
    this.setState({index:index});
  }

  renderSliderHeader(index){
    return(
          <View style={{position:'absolute', zIndex:9999, top:0, right:0, paddingLeft:1, backgroundColor:'white'}}>
            <Text style={{fontSize:10, color:this.props.styles.highlightColor}}>
              {index+1}
              <Text style={{fontSize:8}}>/</Text>
              {this.state.sources.length}
            </Text>
          </View>
    );
  }

  render(){
    // TODO lots of render !! ?
    console.log('render ImagePicker ' + this.props.title);
    // console.log('  props', this.props);
    // console.log('  state', this.state);
    console.log(this.state.index);
    console.log(this.state.sources);

    // const currentImageIsSelected = 
    //   this.state.sources.length 
    //   && this.state.sources[this.state.index].url == 'file://' + this.props.path +'/'+ this.props.filename 
    //   ? true
    //   : false;

    return(
      <View style={this.props.styles.container}
        >

        { // Modal image Slider/Thumb list.
          this.state.bigGalleryIndex === false
          ? null
          : <ImageGallery
            ref={"gallery"}
            title={this.props.title ? this.props.title.replace("\n", " ") : ''}
            visible={this.state.bigGalleryIndex}
            onCancel={this.hideImageGallery}

            path={this.props.path}  // collection path
            selected={this.props.filename}

            sources={this.state.sources}
            onSelect = {(index, filename)=>this.imageSelected(index, filename)}
            imageDeleted = {(sources, newSelectedImage)=>this.imageDeleted(sources, newSelectedImage)}

            styles={{
              text:{textAlign:'center', color:'white', fontWeight:'bold', fontSize:18},
              container:{height:55, alignItems:'center', justifyContent:'center',
                paddingLeft:20, paddingRight:20,
                backgroundColor:this.props.styles.highlightColor},
              highlightColor:this.props.styles.highlightColor,
            }}

            photoPicked={(path) => this.photoPicked(path)}
          />
        }

        { // Modal Caméra.
          this.props.cam === false
          ? null
          : <React.Fragment>
              <Modal
                visible={this.state.visibleCamera}
                onRequestClose={() => this.photoPicked('close')}>
                
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
                    onPress={(path) => this.photoPicked('close')}
                    >
                    <MaterialCommunityIcons
                      name="chevron-left" 
                      style={[{ color:'white' }]}
                      size={30}
                    />
                  </TouchableOpacity>

                  <ScrollView horizontal={true} style={{marginLeft:10, marginRight:10}}>
                    <Text style={{
                      fontSize:18, fontWeight:'bold', textAlign:'center', 
                      color:'white', 
                    }}>
                     {this.props.title ? this.props.title.replace("\n", " ") : ''}</Text>
                  </ScrollView>

                  { this.state.sources.length
                  ? <TouchableOpacity 
                      style={[
                        {borderLeftWidth:1, borderLeftColor:'white'}, {
                        flexDirection:'row',
                        width:60,
                        justifyContent:'center', alignItems:'center',
                      }]}
                      onPress={()=> this.showImageGallery(this.state.sources.length-1)}
                      >
                      <Text style={{fontSize:16, color:'white', marginRight:5}}>{this.state.sources.length}</Text>
                      <MaterialCommunityIcons
                        name="view-grid"
                        style={{ color:'white'}}
                        size={30}
                      />
                    </TouchableOpacity>
                  : null
                  }

                </View>

                <View style={{flex:1}}>
                <Cam
                  path={this.props.path}
                  photoPicked={(path) => this.photoPicked(path)}
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

              <TouchableOpacity 
                style={{
                  flex:1,
                  alignItems:'center', 
                  justifyContent: 'center',
                }}
                onPress = {() => this.showCam()}
                >
                <Text style={{ fontSize:14, height:50, textAlign:'center',  padding:2,
                color: !this.state.sources.length 
                  ? this.props.styles.badColor 
                  : 'grey', 
                }}>
                {this.props.title}</Text>

                <MaterialCommunityIcons
                  name="camera"
                  style={{
                    backgroundColor:'transparent',
                    marginBottom:5,
                    color:this.props.styles.highlightColor,
                  }}
                  size={30}
                />
              </TouchableOpacity>
            </React.Fragment>
        }

        { // Big selected photo.
          !this.state.sources.length ? null :
          <TouchableOpacity 
            
            style={{
              alignItems:'center', 
              justifyContent: 'center',
              flex:0.5,
              paddingBottom:10,
              // borderColor:greenLight, borderWidth:1,
            }} 
            onPress={ this.props.filename
              ? ()=>this.showImageGallery(this.state.index)
              : ()=>this.showImageGallery(-1)
            }
            >
              
            {
              !this.props.filename 
              ? <Text style={{padding:20, textAlign:'center', color:this.props.styles.badColor}}>
                Sélectionner une photo</Text>

              : <View style={{flex:1, flexDirection:'row'}}>

                  <ImageSizedSquare
                    resizeMode="contain"
                    source={{uri:'file://' + this.props.path +'/'+ this.props.filename }}
                  />

                  { // Photo count.
                    this.state.sources.length < 1
                    ? null
                    : <View 
                        style={{position:'absolute', top:0, right:0,
                          width:26, height:26,
                          alignItems:'center', justifyContent:'center',
                          backgroundColor:'white',
                        }}
                        >
                        <View 
                          style={{position:'absolute', bottom:2, left:2,
                            height:22, width:22, 
                            borderRadius:2, 
                            borderBottomWidth:2, borderBottomColor:this.props.styles.highlightColor,
                            borderLeftWidth:2, borderLeftColor:this.props.styles.highlightColor,
                            backgroundColor:'white',
                          }}
                        />
                        <View 
                          style={{position:'absolute', bottom:6, left:6,
                            alignItems:'center', justifyContent:'center',
                            height:22, width:22, 
                            borderRadius:2, 
                            borderBottomWidth:2, borderBottomColor:this.props.styles.highlightColor,
                            borderLeftWidth:2, borderLeftColor:this.props.styles.highlightColor,
                            backgroundColor:'white',
                          }}
                          >
                          <Text style={{
                            fontWeight:'bold', fontSize:12, textAlign:'center',
                            color:this.props.styles.highlightColor, 
                            backgroundColor:'transparent',
                          }}>
                          {this.state.sources.length}</Text>
                        </View>
                      </View>
                  }

                </View>
            }
          </TouchableOpacity>
        }
      </View>
    );
  }

} // ImagePicker


//=========================================================================================
export class ImageSizedSquare extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props) {
    super(props);
    this.state={size:false};
  }

  setSize(e){
    this.setState({size:e.nativeEvent.layout.width});
  }

  render(){
    return(
      <View 
        style={{flex:1,}}
        onLayout = {(event) => this.setSize(event) } 
        >
        { !this.state.size
        ? null
        : <Image 
            style={{
              width:this.state.size, height:this.state.size
            }}
            resizeMode={this.props.resizeMode}
            source={this.props.source}
          />
        }
      </View>
    );
  }
}

//=========================================================================================
export class ImageSized extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props) {
    super(props);
    this.state={
      height:false,
      width:false,
    };
  }

  setSize(e){
    this.setState({
      width:e.nativeEvent.layout.width,
      height:e.nativeEvent.layout.height,
    });
  }

  render(){
    return(
      <View 
        style={{flex:1,}}
        onLayout = {(event) => this.setSize(event) } 
        >
        { !this.state.height
        ? null
        : <Image 
            style={{
              width:this.state.width, height:this.state.height
            }}
            resizeMode={this.props.resizeMode ? this.props.resizeMode : "contain"}
            source={this.props.source}
          />
        }
      </View>
    );
  }
}


//=========================================================================================
export class ViewSized extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props) {
    super(props);
    this.state={size:false};
  }

  setSize(e){
    this.setState({size:e.nativeEvent.layout.width});
  }

  render(){
    return(
      <View 
        style={[this.props.style,
                this.state.size 
                ? {width:this.state.size, height:this.state.size} 
                : {flex:1}
              ]}
        onLayout = {(event) => this.setSize(event) } 
        >
        { this.state.size
          ? this.props.renderItem()
          : null
        }
      </View>
    );
  }
}

//=========================================================================================
export class ModalHelp extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props) {
    super(props)
    this.state = {}
  }

  render(){
    return(
     <Modal
        onRequestClose={this.props.onCancel}
        visible={this.props.visible}
      >
        <View style={{flex:1}} >

          <Text style={{ textAlign:'center',
            backgroundColor:this.props.highlightColor, paddingTop:30,paddingBottom:20, 
            color:'white', fontWeight:'bold', fontSize:18,
          }}>
          {this.props.content.title}
          </Text>
         
          <View style={{flex:1, alignItems:'center',}}>
          <ScrollView>

            <Text style={{padding:15}}>
            {this.props.content.content}
            </Text>

          </ScrollView>
          </View> 
          <FooterImage/>
          <View style={{flexDirection:'row'}}>
            <TouchableOpacity
              style={{flex:1,backgroundColor:this.props.highlightColor, borderRightWidth:1, borderRightColor:'white'}}
              onPress={this.props.onCancel}
              ><Text style={{textAlign:'center', padding:10,fontWeight:'bold', fontSize:16, color:'white'}}>
              Fermer</Text>
            </TouchableOpacity>
          
          </View>
        </View>
      </Modal>
    );
  }
}


//=========================================================================================
export class Timer extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props) {
    super(props)

    console.log('TIMER - ', new Date(props.time));

    this.timer = null;
    this.countdown = false;
    const now = new Date();
    // now.setSeconds(0);
    now.setMilliseconds(0);
    let diff;
   
    // console.log('now', now);

    if(props.time > now){
      this.countdown = true;
      diff = (props.time - now) /1000;
    }
    else{
      diff = (now - props.time) /1000;
    }

    // console.log('countdown', this.countdown);
    // console.log('diff', diff);

    d = Math.floor(diff / (60*60*24));
    h = Math.floor((diff - (d*60*60*24)) / (60*60));
    m = Math.floor((diff - (d*60*60*24) - (h*60*60)) / 60);
    s = diff - (d*60*60*24) - (h*60*60) - (m*60);

    this.state = {
      day: d,
      hour: h,
      min:  m,
      sec:  s,
    }
  }

  componentDidMount(){
    this.timer = setInterval(() => {this.onTime()}, 1000);
  }

  launch(){
    clearInterval(this.timer);
    this.timer = setInterval(() => {this.onTime()}, 1000);
  }

  componentWillUnmount(){
    clearInterval(this.timer);
  }

  pause(){
    clearInterval(this.timer);
  }
  clear(){
    clearInterval(this.timer);
  }

  formatTime(date) {
    return(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
  }

  onTime(){
    if(this.countdown){
      if(this.state.sec == 0){
        if(this.state.min == 0){
          if(this.state.hour == 0){
            if(this.state.day == 0){
              // Reached
              clearInterval(this.timer);
              if (this.props.onTimeout){
                this.props.onTimeout();
              }
            }
            else {
              this.setState({
                sec:59,
                min:59,
                hour:23,
                day:this.state.day-1,
              });
            }
          }
          else{
            this.setState({
              sec:59,
              min:59,
              hour:this.state.hour-1,
            });
          }
        }
        else{
          this.setState({
            sec:59,
            min:this.state.min-1,
          });
        }
      }
      else{
        this.setState({sec:this.state.sec-1});
      }
    }
    else{
      // Increment.
      if(this.state.sec == 59){
        if(this.state.min == 59){
          if(this.state.hour == 23){
            this.setState({
              sec:0,
              min:0,
              hour:0,
              day:this.state.day+1,
            });
          }
          else {
            this.setState({
              sec:0,
              min:0,
              hour:this.state.hour+1,
            });
          }
        }
        else{
          this.setState({
            sec:0,
            min:this.state.min+1,
          });
        }
      }
      else{
        this.setState({
          sec:this.state.sec+1
        });
      }
    }
  }

  render(){
    return(
        <View >
          <Text style={
            this.props.style ||{ textAlign:'center',
            backgroundColor:'transparent', paddingTop:0,paddingBottom:20, 
            color:'white', fontWeight:'bold', fontSize:18,
          }}>
          {(
            this.state.day 
            ? this.state.day > 1
               ? this.state.day + ' jours '
               : this.state.day + ' jour '
            : ''
            )
          + (this.state.hour? (this.state.hour + ' : ') : '') 
          + pad2(this.state.min) + ' : ' + pad2(this.state.sec)}
          </Text>
        </View>
    );
  }
}


const styles = StyleSheet.create({ 
  target_h: {
    position: 'absolute',
    top:Dimensions.get('window').width/2,
    left: 0,
    right:0,
    height:1,
    backgroundColor:'red',
  },
  target_v: {
    position: 'absolute',
    top: 0,
    left:Dimensions.get('window').width/2,
    bottom:0,
    width:1,
    backgroundColor:'red',
  },

});
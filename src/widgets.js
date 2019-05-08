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
  Animated,
  NetInfo,  
  PermissionsAndroid,
  Alert,
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
export const checkForm = (structure, data) => {
  let ok = true;
  structure.map((value, index) => {
    if( !value.optional){
      if(value.type == 'multiSelect' && data[value.name].length == 0
      || value.type == 'singleSelect' && data[value.name] === null){
        ok = false;
      }
    }
  });
  return ok;
}

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

  fieldChanged(key, value){

    // TODO: store here so parent component do not need to reRender
    // AsyncStorage.setItem(this.props.data.date+'_collection', JSON.stringify( this.state.collection ));
    // this.storeItemField(key, value);
    this.props.fieldChanged(key, value);
  }

  // storeItemField(key, val){
  //   let items = this.state.items;
  //   items[this.state.editing][key] = val;
  //   this.setState({items:items}, function(){
  //     AsyncStorage.setItem(this.props.localStorage, JSON.stringify( this.state.items ));
  //   })
  // }


  render(){
    return (
      this.props.fields.map((field, index) => 
        <View key={index} style={this.props.styles.group}>
          
          <Text style={[this.props.styles.title, 
            ((field.type=='singleSelect' 
                && this.props.currentValues[field.name] === null)

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
                onEndEditing = {(event) => this.fieldChanged(field.name, isNaN(parseInt(event.nativeEvent.text),10) 
                  ? '' : parseInt(event.nativeEvent.text),10)} 
                onSubmitEditing = {(event) => this.fieldChanged(field.name, isNaN(parseInt(event.nativeEvent.text),10) 
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
                    ? () => this.fieldChanged(field.name, 
                        this.props.currentValues[field.name]===value.value ? null : value.value)
                    : () => this.fieldChanged(field.name, this.makeMultiSelect(field.name, value.value))
                  }
                  >
                  <Text style={[this.props.styles.labelText,{
                    color: field.type=='singleSelect' 
                    ? this.props.currentValues[field.name]===value.value ? this.props.styles.highlightColor : 'grey'
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
export class LocationPicker extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    this.state = {
      gpsOpacity:new Animated.Value(1),
      gpsSearching:false,
      connected:false,
    };
    this.toValue = 1;
  }

  componentDidMount(){
    NetInfo.addEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );

    NetInfo.isConnected.fetch().done(
      (isConnected) => { this.setState({'connected':isConnected}); }
    );this.gpsAnimation() 
  }

  componentWillUnmount(){
    NetInfo.removeEventListener(
        'connectionChange',
        this._handleConnectivityChange
    );
    navigator.geolocation.clearWatch(this.watchID);
  }

  _handleConnectivityChange = (isConnected) => {
    // console.log(isConnected);
    this.setState({'connected':isConnected});
  }

  gpsAnimation() {
    if (!this.state.gpsSearching && this.toValue==1){
      return;
    }
  console.log('-'+this.toValue)
    this.toValue = (this.toValue==0) ?1:0;

    console.log(this.toValue)
    Animated.timing(
      this.state.gpsOpacity,
      {
        toValue: this.toValue,
        useNativeDriver: true,
      }
    ).start(() => this.gpsAnimation())  
  }

  geoLoc = async () => {
    if (this.state.gpsSearching) return;

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]);

    // console.log('geoloc permission requested');
    if (granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
    &&  granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED){

      // console.log('geoloc permission granted');
      this.setState({
        gpsSearching:true,
        gpsOpacity:new Animated.Value(0),
        }, function(){ 
        this.gpsAnimation()
      });

      this.watchID = navigator.geolocation.watchPosition(
        (position) => {
          // console.log(position);
          navigator.geolocation.clearWatch(this.watchID);
          this.setState({gpsSearching:false});

          // Get place name
          NativeModules.ioPan.getLocationName(position.coords.latitude, position.coords.longitude)
          .then((ville) => {
            this.props.locationChanged({ 
              lat:position.coords.latitude,
              long:position.coords.longitude, 
              name: ville,
            });
          })          
          .catch((error) => { 
            this.props.locationChanged({
              lat:position.coords.latitude,
              long:position.coords.longitude, 
              name: 'Nom du lieu introuvable',
            });
          }); 

        },
        (error) => {
          this.setState({gpsSearching:false});
          Alert.alert(
            'Position introuvable.',
            'Vérifiez que la géolocalisation est activée sur votre appareil.'
          );
          // console.log('GPS error: ', JSON.stringify(error))
        },{
          enableHighAccuracy:true,
          timeout:500, 
          maximumAge:1000,
        }
      );
    }
  }

  render(){
    return(
      <View>

        <ModalPlace
          ref="modal-place"
          title="Chercher un lieu"//{this.state.collection.name}
          lat={this.props.lat}
          lon={this.props.long}
          name={this.props.name}
          highlightColor={this.props.styles.highlightColor}
          onPlace={(data) => this.props.locationChanged(data)} 
        />
        
        { this.props.lat && this.props.long // && !this.state.gpsSearching
        ? <View style={[styles.collection_subgrp,{marginBottom:10}]}>
            <View style={{flexDirection:'row', flex:1, justifyContent: 'center'}}>
              <Text style={{fontSize:16,
                color:'grey'
                }}
                >{this.props.name}
              </Text>
            </View>
            <View style={{flexDirection:'row', flex:1, justifyContent: 'center'}}>
              <Text style={{fontSize:16,
                color:'grey'
                }}
                >
                { 
                  dmsFormat(deg2dms(this.props.lat, 'lat'))
                  + '   ' + 
                  dmsFormat(deg2dms(this.props.long, 'lon'))
                }
              </Text>
            </View>
          </View>
        : null
        }
      
        <View style={[{flexDirection:'row', flex:1, paddingTop:0}]}>           
          <TouchableOpacity 
            style={{ marginRight:5, 
              flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center', borderWidth:1,
              borderColor:'lightgrey',
            }}
            onPress ={ () => this.geoLoc() }
            >
            <View style={{
              justifyContent:'center',
              alignItems:'center',
              }}>
              <MaterialCommunityIcons
                name="crosshairs" 
                size={20}
                height={40}
                width={60}
                margin={0}
                color={this.props.styles.highlightColor}
                backgroundColor = 'transparent'
              />
              <Animated.View style={[{position:'absolute'}, { opacity: this.state.gpsOpacity }]}>
                <MaterialCommunityIcons
                  name="crosshairs-gps" 
                  size={20}
                  height={40}
                  width={60}
                  margin={0}
                  color={this.props.styles.highlightColor}
                  backgroundColor = 'transparent'
                />
              </Animated.View>
            </View>
            <Text style={{fontSize:16, marginLeft:15,
              color: this.state.gpsSearching ? this.props.styles.highlightColor:'grey'
              }}>
            Localiser</Text>
          </TouchableOpacity>

          { this.state.connected && this.state.connected.type != 'none'
            ? <TouchableOpacity 
                style={{ marginLeft:5,
                  flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center', borderWidth:1,
                  borderColor:'lightgrey',
                  }}
                onPress = {() => this.refs['modal-place'].show()} 
                >
                <MaterialCommunityIcons
                  name="magnify"  // search-web  magnify  map-search
                  style={{
                    backgroundColor:'transparent',
                    color:this.props.styles.highlightColor,
                  }}
                  size={25}
                />
                <Text style={{ fontSize:16, color:'grey'}}>
                Chercher</Text>
              </TouchableOpacity>
            : <View 
                style={{ marginLeft:5,
                  flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center', borderWidth:1,
                  borderColor:'lightgrey',
                  }}
                >
                <Text style={{ fontSize:14, color:'lightgrey'}}>
                Pas de réseau</Text>
              </View>
          }
        </View>
      </View>
    );
  }
}

//=========================================================================================
export class ModalPlace extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);

    console.log('ModalPlace');

    this.state = {
      visible:false,
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
  }

  show(){
    this.setState({visible:true}, function(){
      setTimeout(this.refs.searchText.focus, 1);
    })
  }

  hide(senddata){
    if(senddata){
      this.props.onPlace({lat:this.state.lat,long:this.state.lon, name:this.state.name});
    }
    this.setState({visible:false})
  }

  onSearchInput(text) {
    if (text) {
      text += ', France'
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

  render() {
    // if(!this.state.visible) return null; // looks like rn do this by default.

    return (
      <Modal
        onRequestClose={()=>this.hide(false)}
        visible={this.state.visible}
      >

        <View style={{flex:1}} >

          <View 
            style={{
              height:55, flexDirection:'row', 
              justifyContent:'center', alignItems:'center',
              backgroundColor:this.props.highlightColor
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

            <View 
              // <ScrollView horizontal={true} style={{marginLeft:10, marginRight:10}}>
              style={{flex:1,
               alignItems:'center', justifyContent:'center',
              }}>
              <Text style={{
                fontSize:18, fontWeight:'bold', textAlign:'center', 
                color:'white', 
              }}>
               {this.props.title ? this.props.title.replace("\n", " ") : ''}</Text>
            </View>

          </View>

          <View 
            style={{
              height:55, flexDirection:'row', 
              justifyContent:'center', alignItems:'center',
              // backgroundColor:this.props.highlightColor
              }}
            >
            <TextInput
              underlineColorAndroid='transparent'
              ref='searchText'
              placeholder='Ville, Département'
              style={{ 
                fontSize:18,
                textAlign:'center',
                backgroundColor:'white', 
                flex:1,
                margin:0, 
                marginRight:20,
                padding:3,
              }}
              onEndEditing =    {(event) => this.onSearchInput( event.nativeEvent.text) } 
              onSubmitEditing = {(event) => this.onSearchInput( event.nativeEvent.text) } 
            />
            </View>


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

          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>

            <Text style={{fontSize:18}}>{this.state.name}</Text>

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

          <View style={{flexDirection:'row',flexDirection:'row', alignItems:'center', justifyContent:'center',
            height:55, backgroundColor:this.props.highlightColor,}}>
            <TouchableOpacity
              style={{flex:1}}
              onPress={()=>this.hide(true)}
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

  scanFolder(newfilename){
    RNFetchBlob.fs.ls(this.props.path)
    .then((files) => {

      if(files.length){
        files.sort();

        const sources = [],
              index = newfilename
                    ? files.indexOf(newfilename.replace(this.props.path+'/', ''))
                    : files.indexOf(this.props.filename)
        ;

        files.forEach((filename)=> {
          sources.push({ url:'file://' + this.props.path +'/'+ filename 
                         + '?' + new Date().getTime() });
        });

        this.setState({
          index: index!=-1 ? index : 0,
          sources:sources,
        });

        if(newfilename){
          this.showImageGallery(index);
        }
      }

    });  
  }

  showImageGallery = (index) => {
    this.refs['gallery'].gotoImage(index); // close crop window and open slide.
  }

  showCam(){
    this.nbTakenPhoto = 0;
    this.setState({
      visibleCamera:true,
      bigGalleryIndex:false,
    })
  }

  photoPicked(path){
    console.log(path);
    if(path=='close'){

      // If only one photo, selected it.
      if(this.state.sources.length == 1){
        // console.log('onephoto',this.state.sources[0].url.replace('file://' + this.props.path,''))
        // console.log(this.props.path);
        // console.log(this.state.sources[0].url);
        this.props.onSelect(this.state.sources[0].url.replace('file://' + this.props.path,''));
      }
      
      this.setState({ visibleCamera:false });
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

       
        <ImageGallery
            ref={"gallery"}
            title={this.props.title ? this.props.title.replace("\n", " ") : ''}

            path={this.props.path}  // collection path
            selected={this.props.filename}

            sources={this.state.sources}
            onSelect = {(index, filename)=>this.imageSelected(index, filename)}
            imageDeleted = {(sources, newSelectedImage)=>this.imageDeleted(sources, newSelectedImage)}

            imageCroped={(path)=> this.scanFolder(path)}

            styles={{
              text:{textAlign:'center', color:'white', fontWeight:'bold', fontSize:18},
              container:{height:55, alignItems:'center', justifyContent:'center',
                paddingLeft:20, paddingRight:20,
                backgroundColor:this.props.styles.highlightColor},
              highlightColor:this.props.styles.highlightColor,
            }}

            photoPicked={(path) => this.photoPicked(path)}
          />
      

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
                ref="button"
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
                    source={{uri:'file://' + this.props.path +'/'+ this.props.filename
                      + '?' + new Date().getTime() 
                    }}
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
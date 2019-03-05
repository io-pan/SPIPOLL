/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';

import {Platform, StyleSheet, Text, View,
  Dimensions,
  ScrollView,
  Button,
  TouchableHighlight ,
  TouchableOpacity ,
  Alert,
  Image,
  PermissionsAndroid,
  NativeModules,
  PixelRatio,
  Slider,
  CheckBox,
  StatusBar,
  PanResponder,
  Animated,
  TextInput,
  AsyncStorage,
} from 'react-native';

import SplashScreen from "rn-splash-screen";
import KeepScreenOn from 'react-native-keep-screen-on';
import RNFetchBlob from 'rn-fetch-blob';
import { RNCamera } from 'react-native-camera';
// import ViewShot from "react-native-view-shot";
import BluetoothCP  from "react-native-bluetooth-cross-platform"
import Icon from 'react-native-vector-icons/FontAwesome';             // http://fontawesome.io/icons/          
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';  // https://material.io/icons/
import FontAwesomeIcons  from 'react-native-vector-icons/FontAwesome';;
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import SpipolLogin from  "./src/spipoll-login-form"
import CollectionForm from "./src/collection-form"
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import RNThumbnail from 'react-native-thumbnail';

import Svg,{
    Ellipse,
} from 'react-native-svg';

let source;
let motionMask;
const _source = resolveAssetSource(require('./img/bug.png'));
const _motionMask = resolveAssetSource(require('./img/round_mask.png'));
if (__DEV__) {
  source = { uri: `${_source.uri}` };   // uri: `file://${_source.uri}?id=${article.id}` 
  motionMask = { uri: `${_motionMask.uri}` };
}
else {
  // const sourceAndroid = {uri: 'asset:/img/round_mask.png'};//const sourceAndroid = { uri: `file:///android_asset/helloworld.html?id=${article.id}` };
  // const sourceIOS = { uri: 'file://${_source.uri}' };
  // source = Platform.OS === 'ios' ? sourceIOS : sourceAndroid;
  source = {uri: 'asset:/img/bug.png'};
  motionMask = {uri: 'asset:/img/round_mask.png'};
}

// Spipoll greens
const greenDark = "#231f20";
const green = "#d2e284";
const greenLight = "#e0ecb2";
const greenSuperLight ="#ecf3cd"
const greenFlash ="#92c83e";


const landmarkSize = 2;
//----------------------------------------------------------------------------------------
class Draggable extends Component {
//----------------------------------------------------------------------------------------    
  constructor(props) {
    super(props);

    this.state = {
      showDraggable: true,
      // dropAreaValues: null,
      pan: new Animated.ValueXY(),
      opacity: new Animated.Value(1)
    };
    this.initialPos = props.initialPos ? props.initialPos : {x:0,y:0};
  }

  componentWillMount() {
    this._val = { x:0, y:0 }

    this.state.pan.addListener((value) => {
      this._val = value;
      // Frame adjustment callback.
      this.props.onMove({
        x:value.x+this.initialPos.x,
        y:value.y+this.initialPos.y,
      });
    });

    this.panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (e, gesture) => true,
        onPanResponderGrant: (e, gesture) => {
          this.state.pan.setOffset(this._val)
          this.state.pan.setValue({ x:0, y:0})
        },
        onPanResponderMove: Animated.event([ 
          null, { dx: this.state.pan.x, dy: this.state.pan.y }
        ]),
        onPanResponderRelease: (e, gesture) => {
            if (this._val.x + this.initialPos.x < CIRCLE_RADIUS
            ||  this._val.y + this.initialPos.y < CIRCLE_RADIUS
            ||  this._val.x + this.initialPos.x > this.props.previewWidth-CIRCLE_RADIUS
            ||  this._val.y + this.initialPos.y > this.props.previewHeight-CIRCLE_RADIUS
            ) {
              Animated.spring(this.state.pan, {
                toValue: { x: 0, y: 0 },
                friction: 5
              }).start();   
            }
 
          // if (this.isDropArea(gesture)) {
            // Animated.timing(this.state.opacity, {
            //   toValue: 0,
            //   duration: 1000
            // }).start(() =>
            //   this.setState({
            //     showDraggable: false
            //   })
            // );
          // }  
          // else {
          //   Animated.spring(this.state.pan, {
          //     toValue: { x: 0, y: 0 },
          //     friction: 5
          //   }).start();
          // }
        }
      });
  }

  // isDropArea(gesture) {
  //   return gesture.moveY < 200;
  // }

  render() {
    return (
      <View >
        {this.renderDraggable()}
      </View>
    );
  }

  renderDraggable() {
    const panStyle = {
      transform: this.state.pan.getTranslateTransform()
    }
    if (this.state.showDraggable) {
      return (
        <View style={{ position: "absolute", left: this.initialPos.x-CIRCLE_RADIUS , top:this.initialPos.y-CIRCLE_RADIUS }}>
          <Animated.View
            {...this.panResponder.panHandlers}
            style={[panStyle, styles.circle,/* {opacity:this.state.opacity}*/]}
          />
        </View>
      );
    }
  }
}


//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
export default class App extends Component<Props> {
//-----------------------------------------------------------------------------------------


  constructor(props) {
    super(props);
    this.state = {
      storage:false,
      devices: [],
      connectedTo:false,
      distantPicture:false,
      imgLocal: false,
      imgTest:false,//'file:///'+RNFetchBlob.fs.dirs.DCIMDir+'/test.jpg',


      previewWidth:Dimensions.get('window').width,
      previewHeight:Dimensions.get('window').width*4/3,
      cam: 'free', // Different reasons why cam is on:
        // 'free'
        // 'collection-flower'
        // 'collection-environment'
        // 'session' ( = free while session running)
        // 'motion-preview' (while setting motion parameters)
        // 'motion-running' (while session running) 
      distantcam:false,
      previewing:false,
      distantRec:false,
      isRecording:false,
      isTakingPicture:false,
      motionDetected:false,
      motionBase64:'',
      motionDetectionMode: 1, // -1:detector paused,  0:running,   1:previewing,
      threshold : 0xa0a0a0,
      sampleSize : 30,
      minimumPixels: 1,
      motionPreviewPaused:false,

      motionAction:{
        type:'',
        photoNumber:'',
        videoLength:'',
      },
      // faces:[],
      zoom:0,

      showDraggable: true,
      dropAreaValues: null,
      pan: new Animated.ValueXY(),
      opacity: new Animated.Value(1),

      motionInputAreaShape:'',
      motionInputAreaStyle:{
        top: 60,
        left: 60,
        width: Dimensions.get('window').width - 60 - 60,
        height: Dimensions.get('window').width*4/3 - 60 - 60,
      },

      bigBlackMask:false,
    };

    this.poignee = [{
      x:60,
      y:60,
    },{
      x: Dimensions.get('window').width - 60, 
      y: Dimensions.get('window').width*4/3 - 60,
    }];


    this.camRequested = false;
    this.stopRecordRequested = false;
    this.safeIds = [
      '6b16c792365daa8b',  //  s6
      'add41fbf38b95c65',  //  s9
    ],

    this.appDirs = [];

    this.photoNumber=false;
    this.videoMotion=false;
    this.motionActionRunning=false;
  }

  requestForPermission = async () => {
    try{
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ])
      // if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      // // &&  granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      // // &&  granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      // // &&  granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
      // // &&  granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
      // ){
        
      // }
      // else {
      //   // Exit app.
      // }

      SplashScreen.hide();
      // LDPI: Portrait: 200x320px. 
      // MDPI: Portrait: 320x480px.
      // HDPI: Portrait: 480x800px. 
      // XHDPI: Portrait: 720px1280px. 
      // XXHDPI: Portrait: 960px1600px.
      // XXXHDPI: Portrait: 1280px1920px
    } catch (err) {
      console.warn(err)
    }
  }

  componentWillMount() {
    StatusBar.setHidden(true);

    AsyncStorage.getItem('motionAction', (err, motionAction) => {
      if (err) {
        // Alert.alert('ERROR getting locations'+ JSON.stringify(err));
      }
      else {
        if(motionAction){
          motionAction = JSON.parse(motionAction);
          this.setState({motionAction:{
            type: motionAction.type ? motionAction.type : 'photo',
            videoLength: motionAction.videoLength ? motionAction.videoLength : '3',
            photoNumber: motionAction.photoNumber ? motionAction.photoNumber : '3',
          }});
        }
      }
    });


    // Add a listener for the delta value change
    this._val = { x:0, y:0 }
    this.state.pan.addListener((value) => this._val = value);

    // Drag & Drop motion area.
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (e, gesture) => {true},
      onPanResponderMove: Animated.event([
        null, { dx: this.state.pan.x, dy: this.state.pan.y }
      ]),
       onPanResponderRelease: (e, gesture) => {
        if (true) {
          Animated.spring(this.state.pan, {
            toValue: { x: 0, y: 0 },
            friction: 5
          }).start();
        }
        //  // 
        //   Animated.timing(this.state.opacity, {
        //     toValue: 0,
        //     duration: 1000
        //   }).start(() =>
        //     this.setState({
        //        showDraggable: false
        //     })
        //   );
      
        //   Animated.spring(this.state.pan, {
        //     toValue: { x: 0, y: 0 },
        //     friction: 5
        //   }).start();
      }
    });
  }

  testBattery(){
    NativeModules.ioPan.getLevel()
    .then((level) => {
      console.log(level);
      if (level < 15) {
        // TODO send alert to distant.
      }
    })
  }
  // getBatteryLevel = (callback) => {
  //   NativeModules.ioPan.getBatteryStatus(callback);
  // }

  componentDidMount() {
    // this.getBatteryLevel(
    //   (batteryLevel) => {
    //     console.log(batteryLevel);
    //   }
    // );
    setInterval(this.testBattery,60000);
    KeepScreenOn.setKeepScreenOn(true);

    this.requestForPermission();

    BluetoothCP.advertise("WIFI");   // "WIFI", "BT", and "WIFI-BT"
    BluetoothCP.browse('WIFI');
    this.listener1 = BluetoothCP.addPeerDetectedListener(this.PeerDetected)
    this.listener2 = BluetoothCP.addPeerLostListener(this.PeerLost)
    this.listener3 = BluetoothCP.addReceivedMessageListener(this.receivedMessage)
    this.listener4 = BluetoothCP.addInviteListener(this.gotInvitation)
    this.listener5 = BluetoothCP.addConnectedListener(this.Connected)

    // Get app available folders and set default.
    NativeModules.ioPan.getExternalStorages()
    .then((dirs) => {
      this.appDirs = JSON.parse(dirs);
      this.setState({storage:this.appDirs[0].path});

      // TODO: do this on collection / session create
      RNFetchBlob.fs.isDir(this.appDirs[0].path+'/thumb')
      .then((isDir) => {
        if(!isDir){
          RNFetchBlob.fs.mkdir()
          .then(() => { console.log('thumb folder created') })
          .catch((err) => { console.log('error thumb folder created ', err) })
        }
      })
    })
    .catch((err) => { console.log('getExternalStorages', err) })
  }

  componentDidUpdate(){

  }

  componentWillUnmount() {
    this.listener1.remove()
    this.listener2.remove()
    this.listener3.remove()
    this.listener4.remove()
    this.listener5.remove()

    let devices = this.state.devices;
    devices.forEach(function(item, index){
      if (item.connected){
        BluetoothCP.disconnectFromPeer(item.id);
      }
    });

    BluetoothCP.stopAdvertising();
  }

  //--------------------------------------------------------
  //            P2P communication
  //--------------------------------------------------------

  toggleStorage(index) {
    this.setState({storage:this.appDirs[index].path});
  }

  PeerDetected = (user) => {
    // Alert.alert(JSON.stringify({'PeerDetected':user}, undefined, 2));
    let devices = this.state.devices;
    devices.push(user);
    this.setState({devices:devices});
  }

  PeerLost = (user) => {
    // Alert.alert(JSON.stringify({'PeerLost':user}, undefined, 2));
    let devices = this.state.devices;
    let i = false;
    devices.forEach(function(item, index){
      if (item.id == user.id){
        i = index;
        return;
      }
    });
    if (i!==false){
      devices.splice(i, 1);
    }
    this.setState({devices:devices})
    BluetoothCP.advertise("WIFI-BT");
  }

  Connected = (user) => {
    // Alert.alert(JSON.stringify({'Connected':user}, undefined, 2));
    let devices = this.state.devices;
    devices.forEach((item, index)=>{
      if (item.id == user.id){
        devices[index] = user;
        this.setState({devices:devices, connectedTo:user.id})
        BluetoothCP.stopAdvertising();
        return;
      }
    });
  }

  connectToDevice(id){
    BluetoothCP.inviteUser(id);
  }

  gotInvitation = (user) => {
    // TODO: confirm dialog and list safe devices.
    // alert(JSON.stringify(user , undefined, 2));
    // if(this.safeIds.indexOf(user.id) >= 0) {
      BluetoothCP.acceptInvitation(user.id);
    // }
  }

  sendMessage(id, key, value){
    //alert(JSON.stringify({key:key , value:value }));
    console.log(key, value);
    if(id){
      BluetoothCP.sendMessage(JSON.stringify({key:key , value:value }), id);
    }
  }

  receivedMessage = (user) => {
    // alert(JSON.stringify(user , undefined, 2));

    let msg = user.message;
    msg = JSON.parse(msg);
    console.log(msg);
    if(msg.key == 'txt') {
      Alert.alert(msg.value);
    }
    else if(msg.key == 'distantcam') { // for button.
      this.setState({distantcam:msg.value});
    }
    else if(msg.key == 'distantRec') { // for button.
      this.setState({distantRec:msg.value});
    }

    else if(msg.key == 'cmd') {

      if(msg.value == 'cam') {
        // this.camRequested = true;
        this.setState({cam:'free'});
      } 
      
      if(msg.value=='takePicture'){
        this.pictureRequested = true;
        this.takePicture();
      }
      else if(msg.value=='startRecording'){
        this.stopRecordRequested = false;
        this.takeVideo();
      }
      else if(msg.value=='stopRecording'){
        this.stopRecordRequested = true;
        this.camera.stopRecording();
      }

      else{
        this.setState({[msg.value]:!this.state[msg.value]});
      }
    }

    else if(msg.key == 'img') {
      this.setState({distantPicture:'data:image/png;base64,'+msg.value}, function(){
        if(this.state.previewing){
          this.sendMessage(this.state.connectedTo, 'cmd', 'takePicture');
        }
      });
    }
  }

  snap(){
    this.sendMessage(this.state.connectedTo, 'cmd', 'takePicture');
  }
  
  togglePreview(){
    this.setState({previewing:!this.state.previewing}, function(){
      if(this.state.previewing){
        this.sendMessage(this.state.connectedTo, 'cmd', 'takePicture');
      } 
    });
  }

  toggleRecord(){
    if(this.state.distantRec){
      this.sendMessage(this.state.connectedTo, 'cmd', 'stopRecording');
    }
    else{
      this.sendMessage(this.state.connectedTo, 'cmd', 'startRecording');
    } 
  }


  // -------------------------------------------------
  //                    Camera 
  // -------------------------------------------------

  formatedDate(){
    now = new Date();
    year = "" + now.getFullYear();
    month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
    day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
    hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
    minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
    second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
    return year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + second;
  }

  onCameraReady = async () => {
    // const getAvailablePictureSizes = await this.camera.getAvailablePictureSizes('4:3');
    // console.log(getAvailablePictureSizes);
    // const getSupportedRatiosAsync = await this.camera.getSupportedRatiosAsync();
    // console.log(getSupportedRatiosAsync);
    // const getPreviewSize = await this.camera.getPreviewSize();
    // console.log(getPreviewSize);
    SplashScreen.hide();
  }

  onMotionDetected = ({ motion }) => {

    // if (this.state.motionPreviewPaused) 
    //   return;

    console.log('MOTION', motion);
    console.log(this.videoMotion + ' ' + this.photoNumber); 

    this.curMode = this.state.motionDetectionMode;
    this.setState({
      // motionDetectionMode:(this.state.motionDetectionMode==0) ? -1 : this.curMode,
      motionDetected:motion.motionDetected,
      motionBase64: motion.motionBase64,
    }, function(){
      //
    });  

    if(this.motionActionRunning){
      return;
    }

    if (motion.motionDetected
    && this.state.motionDetectionMode==0
    // && this.state.cam != 'motion-running'
    ){
      this.motionActionRunning = true;
      if(!this.videoMotion && this.state.motionAction.type=='video'){
        this.videoMotion = true;
        this.takeVideo();
      }
      else if(!this.photoNumber && this.state.motionAction.type=='photo'){
        this.photoNumber = 1;
        this.takePicture();
      }
    }
  }

  takePicture = async () => {
    console.log('takePicture ' + this.photoNumber);

    if (this.camera) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);
          // console.log(granted);

        if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        &&  granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED){

          const options = { 
            quality: 0.9,
            fixOrientation: true,
          }

          if(this.pictureRequested){
            options.base64 = true;
          }
          else{
            options.skipProcessing = true;
          }
          try {
            this.setState({ isTakingPicture: true }); 
            var picture = await this.camera.takePictureAsync(options);
            console.log(picture);

// TODO: when we are on motion runnnig mode, set name based on collection name 
            const filename = (this.state.cam=='free' ? this.formatedDate() : this.state.cam) + '.jpg';
            RNFetchBlob.fs.mv(
              picture.uri.replace('file://',''),
              this.state.storage + '/' + filename
            ).then(() => {
              this.setState({ isTakingPicture: false }); 


              // Go on according to requested motion-action.
              console.log(this.photoNumber + ' ' +this.state.motionAction.photoNumber);
              if (this.photoNumber){
                if(this.photoNumber < this.state.motionAction.photoNumber){
                  this.photoNumber++;
                  this.takePicture();
                }
                else{
                  this.motionActionRunning = false;
                  this.photoNumber = false;
                  // this.setState({motionDetectionMode: this.curMode,});
                }
              }              
              
              // Send photo to distant device.
              if(this.pictureRequested){
               this.sendMessage(this.state.connectedTo, 'img', picture.base64);
               this.pictureRequested = false;
              }

              // Send photo back to from.
              if(this.state.cam=='collection-flower'){
                this.setState({
                  cam:'collection-form',
                }, function(){
                  this.refs['collectionForm'].refs['collection-flower'].setSource(
                      {uri:'file:///' + this.state.storage + '/' + filename});
                })
              }
              else if(this.state.cam=='collection-environment'){
                this.setState({
                  cam:'collection-form',
                }, function(){
                  this.refs['collectionForm'].refs['collection-environment'].setSource(
                      {uri:'file:///' + this.state.storage + '/' + filename});
                })
              }

            }).catch((err) => { 
              this.setState({ isTakingPicture: false }); 
              console.log(err) 
            });

          } 
          catch (err) {
            console.log('takePictureAsync ERROR: ', err);
          }
        } else {
         alert('REFUSED');
        }
      } catch (err) {
        // console.warn(err)
      }
    }
  }


  async takeVideo() {
    console.log('takeVideo');

    if (this.camera) {
      try {
        const filename = this.formatedDate() ;
        const path = this.state.storage + '/' + filename + '.mp4';
        // console.log(this.motionSartTime );
        // console.log( this.state.motionAction.until);

        const promise = this.camera.recordAsync({
          path: path,
          maxDuration: this.videoMotion ? this.state.motionAction.videoLength : 30,
        });

        if (promise) {
          this.sendMessage(this.state.connectedTo, 'distantRec', true);
          this.setState({ isRecording: true });

          const {uri} = await promise;

          if (this.stopRecordRequested || this.videoMotion) {
            this.motionActionRunning = false;
            this.videoMotion = false;
            this.sendMessage(this.state.connectedTo, 'distantRec', false);

            // console.log('end vid' + this.curMode);
            this.setState({ isRecording: false, motionDetectionMode: this.curMode});
            // this.setState({motionDetectionMode: this.curMode});
          }
          else {
            this.takeVideo();
          }

          // Store video thumb.
          RNThumbnail.get(path).then((result) => {
            // TODO: folder accordering to collection/session folder
            const thumbDest = this.state.storage + '/thumb/' + filename + '.jpg';
            
            RNFetchBlob.fs.mv(
              result.path.replace('file://',''),
              thumbDest
            ).then(() => {
              console.log(thumbDest);
            }).catch((err) => { 
              console.log('error move video thumb', err);
            });
          });

        }

      }
      catch (err) {
        alert(JSON.stringify({'recording error':err}, undefined, 2));
        this.setState({isRecording:false});
        this.sendMessage(this.state.connectedTo, 'distantRec', false);
      }
    }
  };

  // onFacesDetected = ({ faces }) => {
  //   console.log('FACE', faces);
  //   this.setState({ faces:faces });
  // };
  // onFaceDetectionError = state => console.warn('Faces detection error:', state);

  // renderFace({ bounds, faceID, rollAngle, yawAngle }) {
  //   return (
  //     <View
  //       key={faceID}
  //       transform={[
  //         { perspective: 600 },
  //         { rotateZ: `${rollAngle.toFixed(0)}deg` },
  //         { rotateY: `${yawAngle.toFixed(0)}deg` },
  //       ]}
  //       style={[
  //         styles.face,
  //         {
  //           ...bounds.size,
  //           left: bounds.origin.x,
  //           top: bounds.origin.y,
  //         },
  //       ]}
  //     >
  //       {/*
  //       <Text style={styles.faceText}>ID: {faceID}</Text>
  //       <Text style={styles.faceText}>rollAngle: {rollAngle.toFixed(0)}</Text>
  //       <Text style={styles.faceText}>yawAngle: {yawAngle.toFixed(0)}</Text>
  //       */}
  //     </View>
  //   );
  // }

  // renderFaces() {
  //   return (
  //     <View style={styles.facesContainer} pointerEvents="none">
  //       {this.state.faces.map(this.renderFace)}
  //     </View>
  //   );
  // }

  // onBarCodeRead = (e) => {
  //  console.log( e.data);
  // }

  renderMotion(){
    if (this.state.cam!='motion-preview')
      return null;

    return (
      <React.Fragment>
        {
          this.state.motionBase64
          ? <Image
              pointerEvents="none"
              style={styles.MotionContainer} 
              fadeDuration={0}
              style = {[styles.motionpreview,{width:this.state.previewWidth, height:this.state.previewHeight}]}
              source={{uri: 'data:image/png;base64,' + this.state.motionBase64}}
            />
          : null
        }

       { this.state.motionInputAreaShape != '' 
        && this.state.cam == 'motion-preview'
        ?
          <View 
            style={styles.MotionContainer}>

            { this.state.motionInputAreaShape=='elipse'
              ? <Image 
                  pointerEvents="none"
                  fadeDuration={0}
                  pointerEvents="none"
                  source = {motionMask}
                  resizeMode="stretch"
                  style={[
                    this.state.motionInputAreaStyle,{
                    borderWidth:2, 
                    borderColor:'transparent', 
                    position:'absolute', 
                    opacity:0.4,
                  }]}
                />
              :null
            }

            <View 
              pointerEvents="none"
              style={[
                this.state.motionInputAreaStyle,{
                borderWidth:1, 
                borderColor: this.state.motionInputAreaShape=='elipse' ?  greenDark : greenFlash, 
                position:'absolute'
              }]}
            />

            <View 
              pointerEvents="none"
              style={[styles.motionInputAreaMask,{
                top:0,
                left:0,
                right:0,
                height:this.state.motionInputAreaStyle.top,
              } ]}
            />
            <View 
              pointerEvents="none"
              style={[styles.motionInputAreaMask,{
                left:0,
                right:0,
                top: this.state.motionInputAreaStyle.top+this.state.motionInputAreaStyle.height,
                bottom:0,
              } ]}
            />
            <View 
              pointerEvents="none"
              style={[styles.motionInputAreaMask,{
                top:this.state.motionInputAreaStyle.top,
                left:0,
                width: this.state.motionInputAreaStyle.left,
                height: this.state.motionInputAreaStyle.height,
              }]}
            />
            <View 
              pointerEvents="none"
              style={[styles.motionInputAreaMask,{
                top:this.state.motionInputAreaStyle.top,
                right:0,
                left: this.state.motionInputAreaStyle.left + this.state.motionInputAreaStyle.width,
                height: this.state.motionInputAreaStyle.height,
              }]}
            />     

            { this.state.motionInputAreaShape=='elipse'
              ? 
                <Svg 
                  pointerEvents="none"
                  style={[
                    styles.motionInputArea, 
                    this.state.motionInputAreaStyle, 
                    {borderWidth:2, borderColor:'transparent'}
                  ]}
                  height={this.state.motionInputAreaStyle.height}
                  width={this.state.motionInputAreaStyle.width}
                  >
                  <Ellipse
                    cx={this.state.motionInputAreaStyle.width/2}
                    cy={this.state.motionInputAreaStyle.height/2}
                    rx={this.state.motionInputAreaStyle.width/2 - 1}
                    ry={this.state.motionInputAreaStyle.height/2 - 1}
                    stroke={greenFlash}
                    strokeWidth="2"
                    fill="transparent"
                  />
                </Svg>
              :null
            }
            {/*              
            <View pointerEvents="none"
              style={[styles.motionInputArea,  this.state.motionInputAreaStyle ]}
            />
            */}

            <Draggable 
              onMove = {(value) => this.onMovePoignee(0, value) }
              initialPos = {{x:this.state.motionInputAreaStyle.left, y:this.state.motionInputAreaStyle.top}}
              previewWidth = {this.state.previewWidth}
              previewHeight = {this.state.previewHeight}
            />
            <Draggable
              onMove = {(value) => this.onMovePoignee(1, value) }
              initialPos = {{x:this.state.motionInputAreaStyle.left+this.state.motionInputAreaStyle.width,
                             y:this.state.motionInputAreaStyle.top+this.state.motionInputAreaStyle.height}}
              previewWidth = {this.state.previewWidth}
              previewHeight = {this.state.previewHeight}
            />
          </View>
          :null
        }

      </React.Fragment>
    );
  }


  toggleShape(){
    this.setState({motionInputAreaShape: 
      this.state.motionInputAreaShape == ''
      ? 'elipse'
      : this.state.motionInputAreaShape == 'elipse'
          ? 'rectangle'
          : ''
      })
  }

  renderMotionSetupSlider(){
    return(

          <View
          >
            {/*
            <Button 
              style={{ 
                margin:1, 
                height:40 ,
                marginBottom:2,
              }}
              color={ this.state.previewing ? '#338433' : 'grey'}
              title = 'Pause motion'
              onPress = {() => this.togglePreviewMotion()}
            />
            */}

            <Slider  
              ref="sampleSize"
              style={styles.slider} 
              thumbTintColor = '#000' 
              minimumTrackTintColor='#cccccc' 
              maximumTrackTintColor='#ffffff' 
              minimumValue={-parseInt(this.state.previewWidth/10,10)}
              maximumValue={-1}
              step={1}
              value={-this.state.sampleSize}
              onValueChange={
                (value) => this.onSampleSize(-value)
              } 
            />
  
            <Slider  
              ref="threshold"
              style={styles.slider} 
              thumbTintColor = '#fff' 
              minimumTrackTintColor='#dddddd' 
              maximumTrackTintColor='#ffffff' 
              minimumValue={-255}
              maximumValue={0}
              step={1}
              // value={this.state.threshold}
              value={
                -(
                  (this.state.threshold>>>16) 
                + ((this.state.threshold&0x00ff00)>>>8)
                + (this.state.threshold&0x0000ff)
                )/3
              }
              onValueChange={(value) => this.onThreshold(0xffffff, (-value<<16)|(-value<<8)|-value)} 
            />
              <Slider  
                ref="threshold_red"
                style={styles.slider} 
                thumbTintColor = '#d00' 
                minimumTrackTintColor='#dd0000' 
                maximumTrackTintColor='#dd0000' 
                minimumValue={-255}
                maximumValue={0}
                step={1}
                value={-(this.state.threshold>>>16)}
                onValueChange={(value) => this.onThreshold(0xff0000, -value<<16)} 
              />
              <Slider  
                ref="threshold_green"
                style={styles.slider} 
                thumbTintColor = {greenFlash}
                minimumTrackTintColor={greenFlash}
                maximumTrackTintColor={greenFlash}
                minimumValue={-255}
                maximumValue={0}
                step={1}
                value={-((this.state.threshold & 0x00ff00) >>> 8)}
                onValueChange={(value) => this.onThreshold(0x00ff00,-value<<8)} 
              />
              <Slider  
                ref="threshold_blue"
                style={styles.slider} 
                thumbTintColor = '#0000dd' 
                minimumTrackTintColor='#0000dd' 
                maximumTrackTintColor='#0000dd' 
                minimumValue={-255}
                maximumValue={0}
                step={1}
                value={-(this.state.threshold & 0x0000ff)}
                onValueChange={(value) => this.onThreshold(0x0000ff,-value)} 
              />
  
            <Slider  
              ref="minimum_pixels"
              style={styles.sliderDenoise} 
              thumbTintColor='#000' 
              minimumTrackTintColor='#ff0000' 
              maximumTrackTintColor='#0000ff' 
              minimumValue={1}
              maximumValue={this.state.previewWidth/this.state.sampleSize}
              step={1}
              value={this.state.minimumPixels}
              onValueChange={(value) => this.onMinimumPixels(value)} 
            />
            <Text>{this.state.minimumPixels}</Text>
          </View>

    );
  }

  renderCamActionButtons(){   
    if(this.state.cam == 'motion-preview')
          return null;
    
    return (
      <View style={styles.iconButtonContainer} >
        <View style={styles.iconButton}>
        <MaterialCommunityIcons.Button   
          name='camera'
          underlayColor={greenSuperLight}
          size={40}
          width={100}
          margin={0}
          paddingLeft={30}
          color= { this.state.isTakingPicture ? 'red' : greenFlash}
          backgroundColor ={'transparent'}
          // onPress = {() =>{}}
          onPress = {() => this.takePicture()}
        /></View>

        { this.state.cam != 'collection-flower'
        && this.state.cam != 'collection-environment'
          ?
          <React.Fragment>
          <View style={styles.iconButton}>
          <MaterialCommunityIcons.Button   
            name='video'
            underlayColor={greenSuperLight}
            size={40}
            width={100}
            margin={0}
            paddingLeft={30}
            color= { this.state.isRecording ? 'red' : greenFlash}
            backgroundColor ={'transparent'}

            onPress={
              this.state.isRecording 
              ? () => {
                  this.stopRecordRequested = true;
                  this.camera.stopRecording()
                }
              : () => this.takeVideo()
            }
          /></View>

          <View style={styles.iconButton}>
          <MaterialCommunityIcons.Button   
            name='cctv'
            underlayColor={greenSuperLight}
            size={40}
            width={100}
            margin={0}
            paddingLeft={30}
            paddingBottom={12}
            color= {greenFlash}
            backgroundColor ={'transparent'}
            onPress = {() =>{}}
            // onPress = {() => this.takeMotion()}
          /></View>
          </React.Fragment>
          :null
        }
      </View>
    );
    
  }

  toggleMotionAction(type){
    this.setState({motionAction:{
      ...this.state.motionAction,
      type:type,
    }},function(){this.storeMotionAction()}
    );
  } 
  setMotionActionValue(key, val){
    if(isNaN(val)){
      val = 1;
    }
    else if(val<1) {
      val = 1;
    }
    else if (val>60){
      sec = 60;
    }

    this.setState({motionAction:{
      ...this.state.motionAction,
      [key]:val,
    }},function(){this.storeMotionAction()}
    );
    
  }

  storeMotionAction() {  
    AsyncStorage.setItem('motionAction', JSON.stringify(this.state.motionAction));
  }


  renderMotionSetupTodoForm(){
    return(
      <View>
        <Text style={{fontSize:16, textAlign:'center'}}>Lors de la détection de mouvement,</Text>
        <Text style={{fontSize:18, textAlign:'center'}}>prendre ...</Text>

        <View style={[styles.row, {justifyContent: 'space-between',flex:1, marginTop:5}]}>

          <View style={{flex:0.5}}>
          <TouchableOpacity  
            onPress = {() => this.toggleMotionAction('photo')}
            >
            <Text style={[{fontSize:18, textAlign: 'center',
              color: this.state.motionAction.type=='photo' ? greenFlash : 'grey'}]}>
            une série de  {this.state.motionAction.type != 'photo' ? 'photos' : ''}
            </Text>
          </TouchableOpacity>

          { this.state.motionAction.type == 'photo' 
            ? <View style={{flexDirection:'row', flex:1, justifyContent:'center'}}>
              <TextInput
                keyboardType="number-pad"
                textAlign={'center'}
                style={{borderWidth:1, borderColor:greenDark, padding:0, margin:0, marginBottom:2}}
                defaultValue={''+this.state.motionAction.photoNumber}
                onEndEditing =    {(event) => this.setMotionActionValue('photoNumber', parseInt(event.nativeEvent.text,10)) } 
                onSubmitEditing = {(event) => this.setMotionActionValue('photoNumber', parseInt(event.nativeEvent.text,10)) } 
              />
              <Text style={[{fontSize:18, color: greenFlash}]}> photos.</Text>
              </View>
            : null
          }
          </View>

          <View style={[{flex:0.5}]}>
          <TouchableOpacity  
            onPress = {() => this.toggleMotionAction('video')}
            >
            <Text style={{fontSize:18, textAlign:'center', color: this.state.motionAction.type=='video' ? greenFlash : 'grey'}}>
            une vidéo
            </Text>
          </TouchableOpacity>

          { this.state.motionAction.type == 'video' 
            ? <View style={{flexDirection:'row', flex:1, justifyContent:'center'}}>
                <Text style={{fontSize:18, color: greenFlash}}>de </Text>
                <TextInput
                  keyboardType="number-pad"
                  textAlign={'center'}
                  style={{borderWidth:1, borderColor:greenDark, padding:0, margin:0, marginBottom:2}}
                  defaultValue={''+this.state.motionAction.videoLength}
                  onEndEditing =    {(event) => this.setMotionActionValue('videoLength', parseInt(event.nativeEvent.text,10)) } 
                  onSubmitEditing = {(event) => this.setMotionActionValue('videoLength', parseInt(event.nativeEvent.text,10)) } 
                />
                <Text style={{fontSize:18, color: greenFlash}}> secondes.</Text>
              </View>
            : null
          }
          </View>

        </View>

      
        <View style= {{height:60}}></View>
        

      </View>
    );
  }

  renderMotionSetupButtons(){   
    if ( this.state.cam != 'motion-preview')
      return null;

    return(  
      <View>
        <View style={styles.iconButtonContainer} >
        <FontAwesomeIcons.Button   
          name='th' //   th-large      
          underlayColor={greenSuperLight}
          size={40}
          width={100}
          margin={0}
          paddingLeft={30}
          color= {greenFlash}
          backgroundColor ={'transparent'}
          // onPress = {() =>{}}
          onPress = {() => this.toggleShape()}
        />

        <FontAwesomeIcons.Button   
          name='th-large' //      
          underlayColor={greenSuperLight}
          size={40}
          width={100}
          margin={0}
          paddingLeft={30}
          color= {greenFlash}
          backgroundColor ={'transparent'}
          // onPress = {() =>{}}
          onPress = {() => this.toggleShape()}
        />

        <FontAwesomeIcons.Button   
          name='adjust' //   th-large      
          underlayColor={greenSuperLight}
          size={40}
          width={100}
          margin={0}
          paddingLeft={30}
          color= {greenFlash}
          backgroundColor ={'transparent'}
          // onPress = {() =>{}}
          onPress = {() => this.toggleShape()}
        />
        </View>
        {this.renderMotionSetupSlider()}

        {this.renderMotionSetupTodoForm()}
      </View>

    );
  }

  renderCamera() {
    if(this.state.cam == 'collection-form' || this.state.cam =='login') {
      this.sendMessage(this.state.connectedTo, 'distantcam', false);
      return null;
    }

    if(this.state.connectedTo && this.camRequested){
      this.camRequested = false;
      this.sendMessage(this.state.connectedTo, 'distantcam', true);
    }

    return (
      <View //ViewShot
        ref="viewShot"
        // options={{
        //   format: "jpg", 
        //   quality:1 ,
        // }}
        style={[styles.preview,{width:this.state.previewWidth, height:this.state.previewHeight}]}
      >
      <RNCamera
        ref={cam => (this.camera = cam)}
        style = {[styles.cam,{width:this.state.previewWidth, height:this.state.previewHeight}]}
        onCameraReady = {this.onCameraReady}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        ratio="4:3"
        autoFocus ={RNCamera.Constants.AutoFocus.on}
        zoom={this.state.zoom}

        // onFacesDetected={this.onFacesDetected}
        // onFaceDetectionError={this.onFaceDetectionError}  
        // onBarCodeRead={this.onBarCodeRead}

        motionDetectionMode={this.state.motionDetectionMode}
        onMotionDetected={this.onMotionDetected}
        motionDetectionMinimumPixels={this.state.minimumPixels}
        motionDetectionThreshold={this.state.threshold}
        motionDetectionSampleSize={this.state.sampleSize}
        motionDetectionArea={ 
          this.state.motionInputAreaShape == ''
          ? ""
          : this.state.motionInputAreaShape +";"+  // shape : elypse / rectangle
            Math.ceil(this.state.motionInputAreaStyle.left/this.state.sampleSize) +";"+ 
            Math.ceil(this.state.motionInputAreaStyle.top /this.state.sampleSize) +";"+
            Math.floor(this.state.motionInputAreaStyle.width /this.state.sampleSize) +";"+
            Math.floor(this.state.motionInputAreaStyle.height /this.state.sampleSize) +";"
        }
        >
        {/*this.renderFaces()*/}
        {this.renderMotion()}

        <Slider  
          ref="zoom"
          style={styles.sliderZoom} 
          thumbTintColor = {greenFlash} 
          minimumTrackTintColor={greenFlash} 
          maximumTrackTintColor={greenFlash}
          minimumValue={0}
          maximumValue={1}
          step={0.1}
          value={0}
          onValueChange={
            (value) => this.onZoom(value)
          } 
        />
       </RNCamera>
    
      </View>
    );
  }

  //---------------------------------------------
  //                Render
  //---------------------------------------------

  renderImageTest(){ // distant image
    if (!this.state.imgTest) return null;
    console.log(this.state.imgTest);
    return(
      <Image
        fadeDuration={0} 
        style={styles.captureLocalView} 
        source={{uri:this.state.imgTest}}
      />
    );
  }
  

  renderDistantPicture(){ // distant image
    if (!this.state.distantPicture) return null;
    return(
      <Image 
        fadeDuration={0}
        style={styles.capture} 
        source={{uri:this.state.img}} // {uri: 'asset:/scr.png'}
      />
    );
  }
  
  renderImageLocal(){
    // if (this.state.imgLocal.length==0) return null;
    if (!this.state.imgLocal) return null;
    return(
      <View style={styles.captureLocalView}>
          <Image
            fadeDuration={0}
            style = {styles.captureLocal}
            source = {{uri:this.state.imgLocal}} 
          />
      </View>
    );
  }

  renderOtherButtons(value){
    if(!value.connected || !this.state.distantcam) 
      return null;

    return (
      <View>
      <Button 
        style={{ 
          margin:1, 
          height:40 ,
          marginBottom:2,
        }}
        color={ this.state.previewing ? '#338433' : 'grey'}
        title = 'Peview'
        onPress = {() => this.togglePreview()}
      />
      <Button 
        style={{ 
          margin:1, 
          height:40 ,
          marginBottom:2,
        }}
        color={ this.state.previewing ? '#338433' : 'grey'}
        title = 'SNAP'
        onPress = {() => this.snap()}
      />
      <Button 
        style={{ 
          margin:1, 
          height:40,
          marginBottom:2,
        }}
        color= { this.state.distantRec ? '#843333' : 'grey'}
        title = 'rec'
        onPress = {() => this.toggleRecord()}
      />
      {/*     
      <Button 
        style={{ 
          margin:1, 
          height:40,
          marginBottom:2,
        }}
        title = 'send toto'
        onPress = {() => this.sendMessage(value.id, 'txt', 'toto')}
      />
      */}
      </View>
    );
  }

  renderCamButton(value){
    if(!value.connected) 
      return null;

    return (
      <View>
      <Button 
        style={{ 
          margin:1, 
          height:40,
          marginBottom:2,
        }}
        color={this.state.distantcam ? '#338433' : 'grey'}
        title='cam'
        onPress={() => this.sendMessage(value.id, 'cmd', 'cam')}
      />
      { this.renderOtherButtons(value) }
      </View>
    );
  }

  onThreshold(mask, color){
    const threshold = this.state.threshold & ~mask | color;
    this.setState({threshold:threshold});
  }
  onMinimumPixels(value){
    this.setState({minimumPixels:value});
  }
  onSampleSize(value){
    let minimumPixels = this.state.minimumPixels;
    if(minimumPixels > this.state.previewHeight/value){
      minimumPixels = this.state.previewHeight/value;
    }
    this.setState({
      sampleSize:value,
      minimumPixels:minimumPixels,
    });
  }
  onZoom(value){
    this.setState({zoom:value});
  };
  //  togglePreviewMotion() {
  //    var value = !this.state.motionPreviewPaused;
  //    this.setState({motionPreviewPaused:value});
  //  }

  onMovePoignee(id, value){
    // console.log(value);
    this.poignee[id]=value;

    this.setState({motionInputAreaStyle:{
      top: Math.min(this.poignee[0].y, this.poignee[1].y),
      left: Math.min(this.poignee[0].x, this.poignee[1].x),
      width: Math.abs(this.poignee[0].x - this.poignee[1].x),
      height: Math.abs(this.poignee[0].y - this.poignee[1].y),
    }});
  }

  toggleView(view) {
    this.setState({cam:view});
  }

  toggleBigBlackMask() {
    this.setState({bigBlackMask:!this.state.bigBlackMask});
  }

  pickPhoto(view){
    this.setState({cam:view});
  }

  toggleMotionMode(){
    if(this.state.motionDetectionMode==1){
      this.setState({motionDetectionMode:-1});
    }
    else{
      this.setState({motionDetectionMode:this.state.motionDetectionMode+1});
    }
  }

  render() {
    console.log('render');
    const panStyle = {
      transform: this.state.pan.getTranslateTransform()
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ScrollView horizontal={true}>

                    { this.appDirs.length > 1
                      ? this.appDirs.map((value, index) => 
                          <TouchableOpacity  
                            key={index}
                            style={styles.button}
                            onPress = {() => this.toggleStorage(index)}
                            ><Text style={{color: this.state.storage==this.appDirs[index].path ? greenFlash : 'grey'}}>
                            {value.type}
                            </Text>
                          </TouchableOpacity>
                        )
                      : null 
                    }


                    <Button 
                      style={styles.button}
                      color={ !this.state.bigBlackMask ?  'grey' : '#338433' }
                      title = 'mask' 
                      onPress = {() => this.toggleBigBlackMask()}
                    />

                    <Button 
                      style={styles.button}
                      color={ this.state.motionDetectionMode==-1 ?  'grey' : this.state.motionDetectionMode==0 ? '#338433' : '#843333'}
                      title = 'detect' 
                      onPress = {() => this.toggleMotionMode()}
                    />

                    <Button 
                      style={styles.button}
                      color={ this.state.cam=='login' ? '#338433' : 'grey'}
                      title = 'login' 
                      onPress = {() => this.toggleView('login')}
                    />

                    <Button 
                      style={styles.button}
                      color={ this.state.cam=='motion-preview' ? '#338433' : 'grey'}
                      title = 'cam motion' 
                      onPress = {() => this.toggleView('motion-preview')}
                    />
                    <Button 
                      style={styles.button}
                      color={ this.state.cam=='free' ? '#338433' : 'grey'}
                      title = 'cam free'
                      onPress = {() => this.toggleView('free')}
                    />
                    <Button 
                      style={styles.button}
                      color={ this.state.cam=='collection-form' ? '#338433' : 'grey'}
                      title = 'form'
                      onPress = {() => this.toggleView('collection-form')}
                    />
                  </ScrollView>

        </View> 

      <ScrollView>

{/*
        <Image
          ref="bug"
          style={{width:50, height:500,}} 
          source={source}
        />
*/}

        <View style={styles.containerPreview}>

          {/*        
            { this.renderDistantPicture() }
            { this.renderImageTest() }
            { this.renderImageLocal() }
          */}

          { this.renderCamera() }
          {this.renderCamActionButtons()}
          {this.renderMotionSetupButtons()}

        </View>
        


        { this.state.devices.map((value, index) => 
          <View 
            key = {index}
            style = {{flexDirection:'row'}}
            >
            <Button 
              style={{ 
                margin:1, 
                height:40,
                marginBottom:2,
              }}
              title = {value.name}
              color = {value.connected ? '#338433' : 'grey'}
              onPress = {() => this.connectToDevice(value.id)}
            />
            { this.renderCamButton(value) }
          </View>
        )}



        { this.state.cam=="collection-form"
        ? <CollectionForm
            ref="collectionForm"
            filePath={this.state.storage}
            pickPhoto = {(view) => this.pickPhoto(view)}
         />
        : null
        }


        { this.state.cam=="login"
        ? <SpipolLogin
            ref="LOGIN"
         />
        : null
        }

      </ScrollView>

      {this.state.bigBlackMask 
      ?
      <TouchableOpacity ref="black_mask_to_save_battery"
      style={{position:'absolute', backgroundColor:'black', top:0,bottom:0,left:0,right:0}}
      onPress = {() => this.toggleBigBlackMask()}
      />
      :null
      }

      </View>
    );
  }
}

const
CIRCLE_RADIUS = 15,
styles = StyleSheet.create({ 
  motionInputArea:{
    position:'absolute',
  },
  motionInputAreaMask:{
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  circle: {
    backgroundColor:greenFlash,
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    // borderRadius: CIRCLE_RADIUS,
    borderWidth: 1,
    borderColor:greenDark,
  },

  container: {
    flex: 1,
    // justifyContent: 'flex-end',
    // alignItems: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },

  header:{
    alignSelf: 'stretch',
    flexDirection:'row',
    left:0,
    right:0,
    backgroundColor:'transparent',
  },
  slider:{
    padding:10,
    // transform: [{ rotate: '180deg'}],
  },
  sliderDenoise:{
    padding:10,
    paddingBottom:0,
  },
  sliderZoom:{
    padding:15,
  },
  containerPreview: {
    flex: 1,
    flexWrap:'wrap',
    flexDirection:'row',
    justifyContent: 'center',//'flex-end',
    alignItems: 'center',//'flex-end',
    backgroundColor: '#F5FCFF',
  },
  cam: {
    position: 'relative',
    margin:1,
  },
  preview: {
    position: 'relative',
    // width: previewWidth, 
    // height: previewHeight, 
  },
  captureLocalView:{
    // width: previewWidth, 
    // height: previewHeight,
    position:'relative',
    // opacity:0,
  },
  captureLocal:{
    position:'absolute',
    top:0,
    left:0,
    // width: previewWidth, 
    // height: previewHeight, 
    // transform: [{ rotate: '90deg'}],
    resizeMode: 'contain', //enum('cover', 'contain', 'stretch', 'repeat', 'center')
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'red',

  },
  capture:{
    // width: previewWidth, 
    // height: previewHeight, 
    transform: [{ rotate: '90deg'}],
    resizeMode: 'stretch', //enum('cover', 'contain', 'stretch', 'repeat', 'center')
    borderWidth: 1, borderColor: 'red'
  },

  motionpreview:{
    position:'absolute',
    resizeMode: 'contain', //enum('cover', 'contain', 'stretch', 'repeat', 'center')
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'red',
  },

  MotionContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },

  iconButtonContainer:{
    // backgroundColor:'rgba(100,100,100,0.5)',
    // position:'absolute',
    // bottom:20,
    left:0,
    right:0,
    padding:5,
    flexDirection:'row',
    // justifyContent: 'space-between',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconButton:{
    marginLeft:20,
    marginRight:20,
    borderRadius:50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow:'hidden',
    width:60,
    height:60,
    backgroundColor:'transparent',
    borderWidth:2,
    borderColor:greenFlash,
  },

  button:{
    margin:1, 
    height:40 ,
    marginBottom:2,
    backgroundColor:'transparent',  
  },

  row: {
    flexDirection: 'row',
  },
 
  // facesContainer: {
  //   position: 'absolute',
  //   bottom: 0,
  //   right: 0,
  //   left: 0,
  //   top: 0,
  // },
  // face: {
  //   padding: 10,
  //   borderWidth: 2,
  //   borderRadius: 2,
  //   position: 'absolute',
  //   borderColor: '#FFD700',
  //   justifyContent: 'center',
  //   backgroundColor: 'rgba(0, 0, 0, 0.5)',
  // },
  // landmark: {
  //   width: landmarkSize,
  //   height: landmarkSize,
  //   position: 'absolute',
  //   backgroundColor: 'red',
  // },
  // faceText: {
  //   color: '#FFD700',
  //   fontWeight: 'bold',
  //   textAlign: 'center',
  //   margin: 10,
  //   backgroundColor: 'transparent',
  // },
});

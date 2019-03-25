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
  KeyboardAvoidingView,
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
import CollectionList from "./src/collections"
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import RNThumbnail from 'react-native-thumbnail';
import Svg,{ Ellipse,} from 'react-native-svg';

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
const sliderHeight = 50;
const MODE_RUN = 0;
const MODE_OFF = -1;
const MODE_SET = 1;

// const landmarkSize = 2; // fce detection


//----------------------------------------------------------------------------------------
class Draggable extends Component {
//----------------------------------------------------------------------------------------    
  constructor(props) {
    super(props);

    this.state = {
      pan: new Animated.ValueXY(),
      opacity: new Animated.Value(1)
    };
    this.initialPos = props.initialPos ? props.initialPos : {x:0,y:0};

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
        // Back to initial position if out of canvas.
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
      }
    });
  }

  render() {
    const panStyle = {
      transform: this.state.pan.getTranslateTransform()
    }
    return (
      <View >
      <View style={{ position: "absolute", 
        left: this.initialPos.x-CIRCLE_RADIUS , 
        top:this.initialPos.y-CIRCLE_RADIUS }}>
        <Animated.View
          {...this.panResponder.panHandlers}
          style={[panStyle, styles.circle]}
        />
      </View>
      </View>
    );
  }
}


//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
export default class App extends Component<Props> {
//-----------------------------------------------------------------------------------------


  constructor(props) {
    super(props);
    this.state = {
      battery:{charging:false, level:0},
      devices: [],
      connectedTo:false,
      distantPicture:false,
      imgLocal: false,
      imgTest:false,//'file:///'+RNFetchBlob.fs.dirs.DCIMDir+'/test.jpg',
      distantcam:false,
      previewing:false,
      distantRec:false,

      zoom:0,
      cam: 'collection-form', // Different reasons why cam is on:
        // 'free'
        // collection-form
        // 'collection-flower'
        // 'collection-environment'
        // 'session' ( = free while session running)
        // 'motion-setup' (while setting motion parameters)
        // 'motion-running' (while session running) 
      // TODO: ? re-think views vs cam state to switch to form etc..

      // Pure layout needs.
      isRecording:false,
      isTakingPicture:false,
      bigBlackMask:false,
      motionSetup:false,  // on/off motion setup icons states.
      motionsCount:0,

      motionDetected:false,
      motionBase64:'',
    
      // motionPreviewPaused:false,
      // faces:[],

      // Locally stored, re-initialised on componentWillMount().
      storage:'',
      motionAction:{
        type:false,
        photoNumber:'',
        videoLength:'',
      },
      motionOutputRunning:'',
      motionDetectionMode: MODE_OFF,
      threshold : 0xa0a0a0,
      sampleSize : 30,
      minimumPixels: 1,
      motionInputAreaShape:'',
      motionInputAreaStyle:{
        top: 60,
        left: 60,
        width: Dimensions.get('window').width - 60 - 60,
        height: Dimensions.get('window').width*4/3 - 60 - 60,
      },
    };
    this.handles = [{
      x:60,
      y:60,
    },{
      x: Dimensions.get('window').width - 60, 
      y: Dimensions.get('window').width*4/3 - 60,
    }];


    this.previewWidth = Dimensions.get('window').width;
    this.previewHeight = Dimensions.get('window').width*4/3;

    this.camRequested = false;
    this.stopRecordRequested = false;
    // TODO: http protocole.
    // TODO: trusted devices.
    // this.safeIds = [
    //   '6b16c792365daa8b',  //  s6 
    //   'add41fbf38b95c65',  //  s9
    // ],

    this.appDirs = [];
    this.photoNumber=false;
    this.videoMotion=false;
    this.motionActionRunning=false;

    this.init();
  }

  // TODO: re-think permissions.
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
      if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      &&  granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
      ){
        // alert('PERMiSSION OK');
      }
      else {
        // alert('NO EPRMiSSION');
        // Exit app.
      }

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

  // TODO: fix that out componentWillMount.
  init() {
    StatusBar.setHidden(true);

    // Get app available folders and set defaults.
    NativeModules.ioPan.getExternalStorages()
    .then((dirs) => {
      this.appDirs = JSON.parse(dirs);

      for(i=0; i<this.appDirs.length; i++){
        const curDir = this.appDirs[i].path;
        RNFetchBlob.fs.isDir(curDir+'/collections')
        .then((isDir) => {
          if(!isDir){
            RNFetchBlob.fs.mkdir(curDir+'/collections')
            .then(() => { console.log('collection folder created') })
            .catch((err) => { console.log('error collection folder created '+curDir, err) })
          }
        })

        // TODO: do this on thumb Create, based on video path.
        RNFetchBlob.fs.isDir(curDir+'/thumb')
        .then((isDir) => {
          if(!isDir){
            RNFetchBlob.fs.mkdir(curDir+'/thumb')
            .then(() => { console.log('thumb folder created ') })
            .catch((err) => { console.log('error thumb folder created '+curDir, err) })
          }
        })
      }

    })
    .catch((err) => { console.log('getExternalStorages', err) })

    // Get stored parameters.
    AsyncStorage.getItem('motion_parameters', (err, motion_parameters) => {
      if (err) {
        // Alert.alert('ERROR getting locations'+ JSON.stringify(err));
      }
      else {
        if(motion_parameters){
          motion_parameters = JSON.parse(motion_parameters);
          this.setState({
            // TODO set default on app install or ask user.
            // pb that phone/SD button not visible until setstate.
            storage: motion_parameters.storage ? motion_parameters.storage : this.appDirs[0].path,
            motionAction:{
              type: motion_parameters.motionAction.type ? motion_parameters.motionAction.type : false,
              videoLength:motion_parameters.motionAction.videoLength ? motion_parameters.motionAction.videoLength : '',
              photoNumber:motion_parameters.motionAction.photoNumber ? motion_parameters.motionAction.photoNumber : '',
            },
            motionOutputRunning:motion_parameters.motionOutputRunning ? motion_parameters.motionOutputRunning : '',
            // motionDetectionMode:motion_parameters.motionDetectionMode ? motion_parameters.motionDetectionMode : MODE_OFF,
            threshold :motion_parameters.threshold ? motion_parameters.threshold :  0xa0a0a0,
            sampleSize :motion_parameters.sampleSize ? motion_parameters.sampleSize :  30,
            minimumPixels:motion_parameters.minimumPixels ? motion_parameters.minimumPixels :  1,
            motionInputAreaShape:motion_parameters.motionInputAreaShape ? motion_parameters.motionInputAreaShape : '',
            motionInputAreaStyle:{
                top: motion_parameters.motionInputAreaStyle&&motion_parameters.motionInputAreaStyle.top ? motion_parameters.motionInputAreaStyle.top : 60,
                left: motion_parameters.motionInputAreaStyle&&motion_parameters.motionInputAreaStyle.left ? motion_parameters.motionInputAreaStyle.left : 60,
                width: motion_parameters.motionInputAreaStyle&&motion_parameters.motionInputAreaStyle.width ? motion_parameters.motionInputAreaStyle.width : Dimensions.get('window').width - 60 - 60,
                height: motion_parameters.motionInputAreaStyle&&motion_parameters.motionInputAreaStyle.height ? motion_parameters.motionInputAreaStyle.height : Dimensions.get('window').width*4/3 - 60 - 60,
              },
          }, function(){
            this.handles = [{
              x:this.state.motionInputAreaStyle.left,
              y:this.state.motionInputAreaStyle.top,
            },{
              x: this.state.motionInputAreaStyle.left+this.state.motionInputAreaStyle.width,
              y: this.state.motionInputAreaStyle.top+this.state.motionInputAreaStyle.height,
            }];
          });
        }
        else {
          // default here
        }
      }
    });
  }

  // Create / Delete  collection folder on each available storage.
  // TODO: lock SD or phone storage for a given collection / session
  createCollectionFolders(collectionName) {
    for(i=0; i<this.appDirs.length; i++){
      const curDir = this.appDirs[i].path;
      RNFetchBlob.fs.mkdir(curDir+'/collections/'+collectionName)
      .then(() => { console.log('coll folder created ' + curDir+'/collections/'+collectionName ) })
      .catch((err) => { console.log('error coll folder creation ' + curDir+'/collections/'+collectionName, err) })
    }
  }
  deleteCollectionFolders(collectionName) {
    for(i=0; i<this.appDirs.length; i++){
      const curDir = this.appDirs[i].path;
      RNFetchBlob.fs.unlink(curDir+'/collections/'+collectionName)
      .then(() => { 
        console.log('coll folder deleted ' + curDir+'/collections/'+collectionName )
      })
      .catch((err) => {
        console.log('error coll folder detetion ' + curDir+'/collections/'+collectionName, err)
      });
    }
  }

  testBattery(){

      NativeModules.ioPan.getBatteryInfo()
      .then((battery) => {
        if(!this.state.bigBlackMask){
          this.setState({battery:battery});
        }
        console.log(battery.level);
        if (battery.level < 15) {
          // TODO send alert (to distant).
        }
      })

  }
  // getBatteryLevel = (callback) => {
  //   NativeModules.ioPan.getBatteryStatus(callback);
  // }

  componentDidMount() {
    console.log('DidMount');

    // this.getBatteryLevel(
    //   (batteryLevel) => {
    //     console.log(batteryLevel);
    //   }
    // );

    // TODO move this to specific component.
    setInterval(() => {this.testBattery()}, 60000);
    KeepScreenOn.setKeepScreenOn(true);

    this.requestForPermission();

    BluetoothCP.advertise("WIFI");   // "WIFI", "BT", and "WIFI-BT"
    BluetoothCP.browse('WIFI');
    this.listener1 = BluetoothCP.addPeerDetectedListener(this.PeerDetected)
    this.listener2 = BluetoothCP.addPeerLostListener(this.PeerLost)
    this.listener3 = BluetoothCP.addReceivedMessageListener(this.receivedMessage)
    this.listener4 = BluetoothCP.addInviteListener(this.gotInvitation)
    this.listener5 = BluetoothCP.addConnectedListener(this.Connected)
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
    this.setState({storage:this.appDirs[index].path},function(){this.storeMotionSettings()});
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

  // todo: both options: snap & real picture
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

    this.setState({
      motionDetected:motion.motionDetected,
      motionBase64: motion.motionBase64,
    }, function(){
      //
    });  

    if(this.motionActionRunning){
      return;
    }

    if (motion.motionDetected
    && this.state.motionDetectionMode==MODE_RUN  // runningmode
    // && this.state.cam != 'motion-running'
    ){
      this.motionActionRunning = true;
      this.setState({motionsCount: this.state.motionsCount+1});
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

            // TODO: when we are on motion runnnig mode, 
              // .. set name based on collection and SESSION name 
            const filename = 
              this.state.cam.indexOf('collection-') >= 0
              ? 'collections/'+ this.state.cam.split('--')[1] + '/' + this.state.cam.split('--')[2] + '.jpg'
              : '/'+ this.formatedDate() + '.jpg';            

            RNFetchBlob.fs.mv(
              picture.uri.replace('file://',''),
              this.state.storage  + '/' + filename
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
                }
              }              
              
              // Send photo to distant device.
              if(this.pictureRequested){
               this.sendMessage(this.state.connectedTo, 'img', picture.base64);
               this.pictureRequested = false;
              }

              // Send photo back to form.
              if (this.state.cam.indexOf('collection-') >= 0){
                const collId =  this.state.cam.split('--')[1];
                const field =  this.state.cam.split('--')[2];
                this.setState({
                  cam:'collection-form',
                }, function(){
                  this.refs['collectionList'].refs['collection-form'].refs['collection-'+field].setSource(
                    {uri:'file://' + this.state.storage + '/' + filename}
                  );
                  // this.refs['collectionList'].setSource(
                  //   collId,
                  //   field,
                  //   {uri:'file://' + this.state.storage + '/' + filename}
                  // );
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
            this.setState({isRecording: false});
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


  onMotionButton(){
    if(this.state.motionDetectionMode!=MODE_OFF){
      // TODO: return to collection>session
      this.setState({
        motionDetectionMode:MODE_OFF,
        motionsCount:0,
      });
    }
    else{
      this.setState({
        cam:'motion-setup',
        motionDetectionMode:MODE_SET
      });
    }
  }

  takeMotion(){
    this.setState({
      cam:'free',
      motionDetectionMode:MODE_RUN
    });
  }

  closeSetupMotion(){
    this.setState({
      cam:'free',
      motionDetectionMode: MODE_OFF,
    }); 
  }

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
    if (this.state.motionDetectionMode == MODE_OFF)
      return null;

    return (
      <React.Fragment>
        { this.state.motionBase64
          ? <Image
              pointerEvents="none"
              style={styles.MotionContainer} 
              fadeDuration={0}
              style = {[styles.motionpreview,{width:this.previewWidth, height:this.previewHeight}]}
              source={{uri: 'data:image/png;base64,' + this.state.motionBase64}}
            />
          : null
        }

        { this.state.motionInputAreaShape
          ? <View style={styles.MotionContainer}>
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
                : null
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
                ? <Svg 
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
                : null
              }

              { this.state.motionDetectionMode == MODE_SET
                ? <React.Fragment>
                  <Draggable 
                    onMove = {(value) => this.onMoveHandle( 0, value) }
                    initialPos = {{
                      x:this.state.motionInputAreaStyle.left, 
                      y:this.state.motionInputAreaStyle.top
                    }}
                    previewWidth = {this.previewWidth}
                    previewHeight = {this.previewHeight}
                  />
                  <Draggable
                    onMove = {(value) => this.onMoveHandle(1, value) }
                    initialPos = {{
                      x:this.state.motionInputAreaStyle.left+this.state.motionInputAreaStyle.width,
                      y:this.state.motionInputAreaStyle.top+this.state.motionInputAreaStyle.height
                    }}
                    previewWidth = {this.previewWidth}
                    previewHeight = {this.previewHeight}
                  />
                  </React.Fragment>
                : null
              }
            </View>
          : null
        }

      </React.Fragment>
    );
  }// renderMotion


  toggleShape(){
    // Besure displaying right handle on right place (actually reset them).
    if (this.state.motionInputAreaShape=='') {
      this.handles = [{
        x:Math.min(this.handles[0].x, this.handles[1].x),
        y:Math.min(this.handles[0].y, this.handles[1].y),
      },{
        x:Math.max(this.handles[0].x, this.handles[1].x),
        y:Math.max(this.handles[0].y, this.handles[1].y),
      }];
    }

    this.setState({
      // motionSetup: this.state.motionSetup=='action'?'':this.state.motionSetup,
      motionInputAreaShape: 
        this.state.motionInputAreaShape == ''
        ? 'elipse'
        : this.state.motionInputAreaShape == 'elipse'
          ? 'rectangle'
          : ''
    }, function(){this.storeMotionSettings()});
  }

  toggleMotionSetup(val){
    if(this.state.motionSetup==val){
      this.setState({
        motionSetup:false,
        // motionInputAreaShape:'',
      });
    }
    else{
      this.setState({
        motionSetup:val,
        // motionInputAreaShape:'',
      }); 
    }
  }

  toggleMotionOutputRunning(val){
    this.setState({motionOutputRunning:val}, function(){this.storeMotionSettings()});
  }

  renderMotionSetupItems(slider){
    return(
  
      <View 
        style={{
          position:'absolute', left:0, right:0, top:0, 
          backgroundColor:'rgba(0,0,0,0.5)',
          marginTop: 
            this.state.motionSetup=='action' || (!this.state.motionAction.type || (!this.state.motionAction.photoNumber && !this.state.motionAction.videoLength))
            ? -200
            : this.state.motionSetup=='minimumPixels' 
              ? -sliderHeight-30
              : this.state.motionSetup=='threshold' 
                ? -sliderHeight*3
                : -sliderHeight
        }}
        >
        <KeyboardAvoidingView behavior="padding">

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

    
        { this.state.motionSetup == 'sampleSize'
          ?
          <Slider  
            ref="sampleSize"
            style={styles.slider} 
            thumbTintColor = '#ffffff' 
            minimumTrackTintColor='#dddddd' 
            maximumTrackTintColor='#ffffff' 
            minimumValue={-parseInt(this.previewWidth/10,10)}
            maximumValue={-1}
            step={1}
            value={-this.state.sampleSize}
            onValueChange={
              (value) => this.onSampleSize(-value)
            } 
          />
          :null
        }

        { this.state.motionSetup == 'threshold'
          ?
          <React.Fragment>
          {/*<Slider  
            ref="threshold"
            style={styles.slider} 
            thumbTintColor = '#ffffff' 
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
          />*/}
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
            </React.Fragment>
          :null
        }

        { this.state.motionSetup == 'minimumPixels'
          ?
          <React.Fragment>
          <Text 
            style={{
              height:30,
              paddingTop:10,
              color:'#ffffff', 
              // backgroundColor:'rgba(0, 0, 0, 0.4)',//this.state.motionInputAreaShape ? 'transparent' : 'rgba(0, 0, 0, 0.4)'
              fontSize:16,
              textAlign:'center',
            }}
          >{this.state.minimumPixels-1} pixel{this.state.minimumPixels-1>1 ? 's':''}</Text>
          <Slider  
            ref="minimumPixels"
            style={styles.slider} 
            thumbTintColor = '#ffffff' 
            minimumTrackTintColor='#dddddd' 
            maximumTrackTintColor='#ffffff' 
            minimumValue={1}
            maximumValue={parseInt(this.previewWidth/this.state.sampleSize,10)}
            step={1}
            value={this.state.minimumPixels}
            onValueChange={(value) => this.onMinimumPixels(value)} 
          />
          </React.Fragment>
          :null
        }

        {/* this.state.motionSetup == 'zoom'
          ?
          <React.Fragment>
          <Text 
            style={{
              height:30,
              color:'#ffffff', 
              backgroundColor:'rgba(0, 0, 0, 0.4)',//this.state.motionInputAreaShape ? 'transparent' : 'rgba(0, 0, 0, 0.4)'
              fontSize:16,
              textAlign:'center',
            }}
          >{this.state.zoom}</Text>
          <Slider  
            ref="zoom"
            style={styles.slider} 
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
          </React.Fragment>
          :null
        */}

        { this.state.motionSetup=='action' || (!this.state.motionAction.type || (!this.state.motionAction.photoNumber && !this.state.motionAction.videoLength))
          ? this.renderMotionSetupTodoForm()
          : null
        }

      </KeyboardAvoidingView>
      </View>
    );
  }

  renderCamActionButtons(){   
    return (
      <View key="renderCamActionButtons" style={styles.iconButtonContainer} >
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

        { this.state.cam.indexOf('collection-') < 0
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
            color= {this.state.motionDetectionMode==MODE_RUN ? 'red' : greenFlash }
            backgroundColor ={'transparent'}
            onPress = {() => this.onMotionButton()}
          /></View>
           
          { this.state.motionsCount
            ? <Text style={{
                marginTop:-40, marginLeft:-30, textAlign:'center',
                height:20,width:20, backgroundColor:'red', borderRadius:20,
                color:'white', fontSize:12, fontWeight:'bold',
                }}>
                {this.state.motionsCount}</Text>
            : null
          }
              
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
    }},function(){this.storeMotionSettings()}
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

    this.setState({
      motionAction:{
        ...this.state.motionAction,
        [key]:val
      },
      motionSetup:false,
    },function(){
      this.storeMotionSettings();
    });
    
  }

  storeMotionSettings(){
    AsyncStorage.setItem('motion_parameters', JSON.stringify({
      motionAction:         this.state.motionAction,
      motionOutputRunning:  this.state.motionOutputRunning,
      // motionDetectionMode:  this.state.motionDetectionMode,
      threshold:            this.state.threshold,
      sampleSize:           this.state.sampleSize,
      minimumPixelskey:     this.state.minimumPixels,
      motionInputAreaShape: this.state.motionInputAreaShape,
      motionInputAreaStyle: this.state.motionInputAreaStyle,
      storage:              this.state.storage,
    }));
  }

  renderMotionSetupTodoForm(){
    return(
      <View style={{height:200, padding:10, backgroundColor: '#F5FCFF',}}>
        {/*<Text style={{padding:10, fontSize:16, textAlign:'center', color:greenFlash,}}>Lorsqu'un mouvement est détecté</Text>*/}
        <Text style={{paddingTop:10, fontSize:18, fontWeight: 'bold', textAlign:'center', color:greenFlash,}}>
          Action en cas de mouvement
        </Text>

        <View style={[styles.row, {justifyContent: 'space-between',flex:1, marginTop:5}]}>

          <View style={{flex:0.5}}>
            { this.state.motionAction.type == 'photo' 
              ? <View 
                  style={{
                    flexDirection:'row', 
                    flex:1, 
                    justifyContent:'center',
                    flexWrap: 'wrap', 
                    alignItems: 'flex-start',
                  }}>
                  <Text style={[{fontSize:18, color: this.state.motionAction.type=='photo' ? greenFlash : greenDark}]}>
                  Prendre </Text>
                  <Text style={[{fontSize:18, color: this.state.motionAction.type=='photo' ? greenFlash : greenDark}]}>
                  une </Text>
                  <Text style={[{fontSize:18, color: this.state.motionAction.type=='photo' ? greenFlash : greenDark}]}>
                  série </Text>
                  <Text style={[{fontSize:18, color: this.state.motionAction.type=='photo' ? greenFlash : greenDark}]}>
                  de </Text>
                <TextInput
                  keyboardType="number-pad"
                  autoFocus={true}
                  textAlign={'center'}
                  style={{backgroundColor:'white', width:30, height:30, borderWidth:1, borderColor:greenDark, padding:0, margin:0}}
                  defaultValue={''+this.state.motionAction.photoNumber}
                  onEndEditing =    {(event) => this.setMotionActionValue('photoNumber', parseInt(event.nativeEvent.text,10)) } 
                  onSubmitEditing = {(event) => this.setMotionActionValue('photoNumber', parseInt(event.nativeEvent.text,10)) } 
                />
                <Text style={[{fontSize:18, color: greenFlash}]}> photo{this.state.motionAction.photoNumber>1?'s':''}.</Text>
                </View>

              : <TouchableOpacity onPress = {() => this.toggleMotionAction('photo')}>
                  <Text style={[{fontSize:18, padding:10, textAlign: 'center',
                    color: this.state.motionAction.type=='photo' ? greenFlash : greenDark}]}>
                  Prendre une série de photos</Text>
                </TouchableOpacity>
            }
          </View>

          <View style={[{flex:0.5}]}>
            { this.state.motionAction.type == 'video' 
              ? <View 
                  style={{
                    flexDirection:'row', 
                    flex:1, 
                    justifyContent:'center',
                    flexWrap: 'wrap', 
                    alignItems: 'flex-start',
                  }}>
                  <Text style={[{fontSize:18, color: this.state.motionAction.type=='video' ? greenFlash : greenDark}]}>
                  Prendre </Text>
                  <Text style={[{fontSize:18, color: this.state.motionAction.type=='video' ? greenFlash : greenDark}]}>
                  une </Text>
                  <Text style={[{fontSize:18, color: this.state.motionAction.type=='video' ? greenFlash : greenDark}]}>
                  vidéo </Text>
                  <Text style={[{fontSize:18, color: this.state.motionAction.type=='video' ? greenFlash : greenDark}]}>
                  de </Text>
                  <TextInput
                    keyboardType="number-pad"
                    autoFocus={true}
                    textAlign={'center'}
                    style={{backgroundColor:'white', width:30, height:30, borderWidth:1, borderColor:greenDark, padding:0, margin:0}}
                    defaultValue={''+this.state.motionAction.videoLength}
                    onEndEditing =    {(event) => this.setMotionActionValue('videoLength', parseInt(event.nativeEvent.text,10)) } 
                    onSubmitEditing = {(event) => this.setMotionActionValue('videoLength', parseInt(event.nativeEvent.text,10)) } 
                  />
                  <Text style={{fontSize:18, color: greenFlash}}> seconde{this.state.motionAction.videoLength>1?'s':''}.</Text>
                </View>

              : <TouchableOpacity onPress = {() => this.toggleMotionAction('video')}>
                  <Text style={{fontSize:18, textAlign:'center', padding:10,
                    color: this.state.motionAction.type=='video' ? greenFlash : greenDark
                  }}>
                  Prendre une vidéo</Text>
                </TouchableOpacity>

              // TODO: Send alert to connected device ?

            }
          </View>
        </View>        
      </View>
    );
  }

  renderMotionSetupButtons(){   
    return(  
      <View key="renderMotionSetupButtons" style={{flex: 1, justifyContent:'space-between'}}>

        {this.renderMotionSetupItems()}

        <View></View>

        <View>
        <ScrollView horizontal={true} >

          <MaterialCommunityIcons.Button   
            // Action
            borderRadius={0} 
            style={{
              flexDirection:'column',
              borderRightWidth:1, borderRightColor:'#dddddd',
              marginLeft:5,
            }}
            name='gesture-double-tap' //   th-large      
            underlayColor={greenSuperLight}
            size={25}
            margin={0}
            paddingLeft={10}
            color= {greenFlash}
            backgroundColor ={'transparent'}
            onPress = {() => this.toggleMotionSetup('action')}
          >
            <Text 
              style={{fontSize:14, padding:0, margin:0, /*marginLeft:-5, marginRight:-7, paddingRight:7,*/ 
                
                color:
                  this.state.motionSetup=='action' || (!this.state.motionAction.type || (!this.state.motionAction.photoNumber && !this.state.motionAction.videoLength)) 
                  ? greenFlash 
                  : 'grey' 
              }}
              >Action</Text>
          </MaterialCommunityIcons.Button>

          <MaterialCommunityIcons.Button   
            // Mask
            borderRadius={0} 
            style={{
              flexDirection:'column',
              borderRightWidth:1, borderRightColor:'#dddddd',
            }}
            name='image-filter-center-focus-weak' //   select-all // selection-ellipse     
            underlayColor={greenSuperLight}
            size={25}
            margin={0}
            color= {greenFlash}
            backgroundColor ={'transparent'}
            onPress = {() => this.toggleShape()}
          >
            <Text 
              style={{fontSize:14, padding:0, margin:0, /*marginLeft:-5, marginRight:-7, paddingRight:7,*/
                color:this.state.motionInputAreaShape ? greenFlash : 'grey' ,}}
              >Masque</Text>
          </MaterialCommunityIcons.Button>

          <MaterialCommunityIcons.Button
            // Précision
            borderRadius={0} 
            style={{
              flexDirection:'column',
              borderRightWidth:1, borderRightColor:'#dddddd',
            }}
            name='blur' //      grid // view-grid //view-comfy
            underlayColor={greenSuperLight}
            size={25}
            margin={0}
            color= {greenFlash}
            backgroundColor ={'transparent'}
            onPress = {() => this.toggleMotionSetup('sampleSize')}
          >
            <Text 
              style={{fontSize:14, padding:0, margin:0, /*marginLeft:-5, marginRight:-7, paddingRight:7,*/
              color:this.state.motionSetup=='sampleSize' ? greenFlash : 'grey' ,}}
              >Précision</Text>
          </MaterialCommunityIcons.Button>

          <MaterialCommunityIcons.Button   
            // Sensibilité
            borderRadius={0} 
            style={{
              // fontSize :16,
              flexDirection:'column',
                alignItems: 'center',
                justifyContent:'center',
              borderRightWidth:1, borderRightColor:'#dddddd',
            }}
            name='contrast-circle' //   contrast-box     
            underlayColor={greenSuperLight}
            size={25}
            color= {greenFlash}
            backgroundColor ={'transparent'}
            onPress = {() => this.toggleMotionSetup('threshold')}
          >
            <Text 
              style={{fontSize:14, padding:0, margin:0, /*marginLeft:-5, marginRight:-7, paddingRight:7,*/
              color:this.state.motionSetup=='threshold' ? greenFlash : 'grey' ,}}
              >Sensibilité</Text>
          </MaterialCommunityIcons.Button>

          <MaterialCommunityIcons.Button   
            // Bruit
            borderRadius={0} 
            style={{
              flexDirection:'column',
              marginRight:5,
            }}
            name='eraser'   
            underlayColor={greenSuperLight}
            size={25}
            margin={0}
            color= {greenFlash}
            backgroundColor ={'transparent'}
            onPress = {() => this.toggleMotionSetup('minimumPixels')}
          >
            <Text 
              style={{fontSize:14, padding:0, margin:0,  /*marginLeft:-5, marginRight:-7, paddingRight:7,*/
              color:this.state.motionSetup=='minimumPixels' ? greenFlash : 'grey' ,}}
              >Antibruit</Text>
          </MaterialCommunityIcons.Button>
        </ScrollView>
        </View>

        <View style={{ 
          flexDirection:'row', 
          backgroundColor:greenFlash}}
          >
          <TouchableOpacity 
            onPress = {() => this.closeSetupMotion()}
            style={{padding:10, 
              flex:this.state.motionAction.type && (this.state.motionAction.photoNumber || this.state.motionAction.videoLength)?0.5:1,
              flexDirection:'row',
              justifyContent:'center',
              borderRightColor:'white', borderRightWidth:1,
            }}>
            <MaterialCommunityIcons   
              name='close'
              size={30}
              padding={0}
              margin={0}
              color='white'
            />
            <Text style={{marginLeft:10, fontWeight:'bold', color:'white', fontSize: 18 }}>
            Fermer</Text>
          </TouchableOpacity>

          { this.state.motionAction.type && (this.state.motionAction.photoNumber || this.state.motionAction.videoLength)
            ? <TouchableOpacity 
              onPress = {() => this.takeMotion()}
              style={{padding:10, 
                flex:0.5,
                flexDirection:'row',
                justifyContent:'center',
              }}>
              <MaterialCommunityIcons
                style={{
                  borderRadius:30,
                  backgroundColor:'white'}}
                name='cctv'
                size={30}
                color ={greenFlash}
              />
              <Text style={{marginLeft:10, fontWeight:'bold', color:'white', fontSize: 18 }}>
              Lancer</Text>
            </TouchableOpacity>
            : null
          }
        </View>
     
      </View>
    );
  }

  renderCamera() {

    if(this.state.connectedTo && this.camRequested){
      this.camRequested = false;
      this.sendMessage(this.state.connectedTo, 'distantcam', true);
    }

    return (
      <View //ViewShot
        key="renderCamera"
        ref="viewShot"
        // options={{
        //   format: "jpg", 
        //   quality:1 ,
        // }}
      >
      <RNCamera
        ref={cam => (this.camera = cam)}
        style = {[styles.cam,{width:this.previewWidth, height:this.previewHeight}]}
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
          : this.state.motionInputAreaShape +";"+
            Math.ceil(this.state.motionInputAreaStyle.left/this.state.sampleSize) +";"+ 
            Math.ceil(this.state.motionInputAreaStyle.top /this.state.sampleSize) +";"+
            Math.floor(this.state.motionInputAreaStyle.width /this.state.sampleSize) +";"+
            Math.floor(this.state.motionInputAreaStyle.height /this.state.sampleSize) +";"
        }
        >
          <Slider  
            ref="zoom"
            style={[styles.slider,{marginRight:60}]} 
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
          { this.state.motionDetected && (this.state.cam=='motion-setup' || this.state.motionDetectionMode==MODE_RUN)
          ? <MaterialCommunityIcons
              style={{
                position:'absolute', top:0, right:0, padding:7, margin:5,
                backgroundColor:'rgba(0,0,0,0.5)',
                borderRadius:40,
              }}
              name='ladybug'
              size={40}
              margin={0}
              color= {greenFlash}
            />
          : null
        }

        {/*this.renderFaces()*/}
        {this.renderMotion()}

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
    this.setState({threshold:threshold}, function(){this.storeMotionSettings()});
  }

  onMinimumPixels(value){
    this.setState({minimumPixels:value}, function(){this.storeMotionSettings()});
  }

  onSampleSize(value){
    let minimumPixels = this.state.minimumPixels;
    if(minimumPixels > this.previewHeight/value){
      minimumPixels = parseInt(this.previewHeight/value);
    }
    this.setState({
      sampleSize:value,
      minimumPixels:minimumPixels,
    }, function(){this.storeMotionSettings()});
  }

  onZoom(value){
    this.setState({zoom:value});
  };
  //  togglePreviewMotion() {
  //    var value = !this.state.motionPreviewPaused;
  //    this.setState({motionPreviewPaused:value});
  //  }

  onMoveHandle(id, value){
    this.handles[id]=value;
    this.setState({motionInputAreaStyle:{
      top: Math.min(this.handles[0].y, this.handles[1].y),
      left: Math.min(this.handles[0].x, this.handles[1].x),
      width: Math.abs(this.handles[0].x - this.handles[1].x),
      height: Math.abs(this.handles[0].y - this.handles[1].y),
    }}, function(){ 
      // this.handles = [{ 
      //   x: Math.min(this.handles[0].x,this.handles[1].x),
      //   y: Math.min(this.handles[0].y,this.handles[1].y),
      //   },{
      //   x: Math.max(this.handles[0].x,this.handles[1].x),
      //   y: Math.max(this.handles[0].y,this.handles[1].y),
      // }];
      this.storeMotionSettings();
    });
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

  render() {
    console.log(this.state.cam);
    return (
      <View style={styles.container}>

        <View style={styles.header}>
          <ScrollView horizontal={true}>

            { // Storege: SD / Phone
              this.appDirs.length > 1
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
              color={ this.state.cam=='login' ? '#338433' : 'grey'}
              title = 'login' 
              onPress = {() => this.toggleView('login')}
            />

            <View style={styles.iconButtonHeader}>
            <MaterialCommunityIcons.Button   
              borderRadius={0}
              name='camera'
              underlayColor={greenSuperLight}
              size={30}
              color={ this.state.cam=='free' ? greenFlash : 'grey'}
              // backgroundColor = { this.state.cam !='collection-form' ? greenFlash : 'white'}
              backgroundColor='transparent'
              onPress = {() => this.toggleView('free')}
            />
            </View>

            <TouchableOpacity 
              style={styles.button}        
              onPress = {() => this.toggleView('collection-form')}
            ><Text style={{ color:this.state.cam=='collection-form' ? greenFlash : 'grey'}}
            >Collections</Text></TouchableOpacity>
          </ScrollView>
        </View> 

        {/*        
        <ScrollView style={{backgroundColor:'red', paddingBottom:200}}>*/}

        {/*
        <Image
          ref="bug"
          style={{width:50, height:500,}} 
          source={source}
        />
        */}

        {/*
        <View style={styles.containerPreview}>
          { this.renderDistantPicture() }
          { this.renderImageTest() }
          { this.renderImageLocal() }
       </View>
        */}


        { // Camera & buttons.
          this.state.cam == 'collection-form' || this.state.cam =='login'
          ? null
          : [this.renderCamera(),
              this.state.cam == 'motion-setup'
              ? this.renderMotionSetupButtons()
              : this.renderCamActionButtons()
            ]
        }


        { // Distant devices.
          this.state.devices.map((value, index) => 
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

        { this.state.cam.indexOf('collection-') >= 0
          ? <View style={this.state.cam!='collection-form'? {height:0}:{flex:1}}>
            <CollectionList
              ref="collectionList"
              filePath={this.state.storage}
              pickPhoto = {(view) => this.pickPhoto(view)}
              createCollectionFolders =  {(collectionName) => this.createCollectionFolders(collectionName)}
              deleteCollectionFolders =  {(collectionName) => this.deleteCollectionFolders(collectionName)}
           />
           </View>
          : null
        }


        { this.state.cam=="login"
        ? <SpipolLogin
            ref="LOGIN"
         />
        : null
        }

        {/*      
        <View style={{height:500}}></View>
      </ScrollView>
      */}

      {this.state.bigBlackMask 
      ? <TouchableOpacity ref="black_mask_to_save_battery"
          style={{
            position:'absolute', backgroundColor:'black', top:0,bottom:0,left:0,right:0,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection:'row',
          }}
          onPress = {() => this.toggleBigBlackMask()}
        >
          <Text
            style={{
              color:this.state.battery.charging ? greenFlash : 'grey', 
              fontSize:50,fontWeight:'bold'}}
            >
            {this.state.battery.level}%
          </Text>
          { this.state.battery.charging
            ? <MaterialCommunityIcons.Button 
                backgroundColor={'transparent'} 
                name='battery-charging'
                size={60}
                color={greenFlash}
              />
            : <MaterialCommunityIcons.Button 
                name='battery-40' 
                color={'grey'}
                backgroundColor={'transparent'}
                size={60}
              /> 
          }
        </TouchableOpacity>
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
    backgroundColor: '#fafaff' //'#F5FCFF',
  },

  header:{
    alignSelf: 'stretch',
    flexDirection:'row',
    left:0,
    right:0,
    backgroundColor:'transparent',
  },
  slider:{
    height:sliderHeight,
    // backgroundColor:'rgba(0, 0, 0, 0.4)',
  },

  containerPreview: {
    flex: 1,
    flexWrap:'wrap',
    // flexDirection:'row',
    // justifyContent: 'flex-end',
    alignItems: 'center',//'flex-end',
    backgroundColor: '#F5FCFF',
  },
  cam: {
    // position: 'relative',
    // margin:1,
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
    // borderWidth: 1,
    // borderColor: 'transparent',
  },

  MotionContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },

  iconButtonContainer:{
    flex:1,
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

  iconButtonHeader:{
    marginLeft:0,
    marginRight:0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow:'hidden',
    height:40,
    backgroundColor:'transparent',
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
 

  // inline:{
  //   padding:5,
  //   flexWrap: 'wrap', 
  //   alignItems: 'flex-start',
  //   flexDirection:'row',
  // }

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

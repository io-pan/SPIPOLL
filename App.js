/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';

import {Platform, StyleSheet, Text, View,
  ScrollView,
  // Button,
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


import CollectionForm from "./src/collection-form"
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

import Svg,{
    Ellipse,
} from 'react-native-svg';

let source;
// const _source = resolveAssetSource(require('./img/scr.png'));
const _source = resolveAssetSource(require('./img/round_mask.png'));

if (__DEV__) {
  source = { uri: `${_source.uri}` };   // uri: `file://${_source.uri}?id=${article.id}` 
}
else {
  const sourceAndroid = {uri: 'asset:/img/round_mask.png'};//const sourceAndroid = { uri: `file:///android_asset/helloworld.html?id=${article.id}` };
  const sourceIOS = { uri: 'file://${_source.uri}' };
  source = Platform.OS === 'ios' ? sourceIOS : sourceAndroid;
}

// Spipoll greens
const greenDark = "#231f20";
const green = "#d2e284";
const greenLight = "#e0ecb2";
const greenSuperLight ="#ecf3cd"
const greenFlash ="#92c83e";


// TODO: 
//  screen W x H ..
//  resize cam preview (on motion-run) based on sampleSize to save battery life.
//  let screen sleep + option to force seep (absolute black layer)
const previewHeight = 480;
const previewWidth = 360;


/*
  CRÉER UNE COLLECTION

  1° la phase "terrain"

    Connection à www.spipoll.org

 
    SESSIONS
      1
        Date 
        Heure 
          debut 
          fin   check > 20min
        Ciel (couverture nuageuse) 
          0-25%   
          25-50%   
          50-75%   
          75-100%  
        Température :
          < 10ºC   
          10-20ºC   
          20-30ºC   
          >30ºC  
        Vent :
          nul   
          faible, irrégulier 
          faible, continu
          fort, irrégulier
          fort, continu  
        Fleur à l'ombre :
          Non   
          Oui

      2 (si protocole long)


    INSECTES
      1
        Photo
        Taxon
        dénomination + précise    UNIQUE
        Commentaire
        SESSION
          ID
          Commentaire
          Nombre maximum d'individus de cette espèce vus simultanément
            1   
            entre 2 et 5   
            plus de 5   
            je nai pas linformation
          Avez-vous photographié cet insecte ailleurs que sur la fleur de votre station florale:
            Non   
            Oui  
      2 ...

    min 2 INSECTES pour cloturer la collection.


2° la phase "préparation des données"
   ... trier et mettre en forme les photos
  Triez vos photos et sélectionnez-en une par espèce ; 
  puis recadrez les insectes au format 4:3 
  (ils doivent être conservés dans leur globalité). 
  Faites alors pivoter les images de manière à ce que vos insectes se retrouvent la tête "en haut" (dans la mesure du possible). 

  De même, recadrez la photo de la fleur.


3° la phase "identification et envoi des données"
  ... charger les photos dans la partie "Mon spipoll",
  identifier la plante et les insectes à l'aide des clés disponibles en ligne, 
  puis envoyer les données

*/


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
            ||  this._val.x + this.initialPos.x > previewWidth-CIRCLE_RADIUS
            ||  this._val.y + this.initialPos.y > previewHeight-CIRCLE_RADIUS
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
class FreshImages extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    this.state = {};
    this.count = this.props.count ? this.props.count : 3;
    this.curId = 0;
    this.source =  new Array(this.count);
    this.opacity = new Array(this.count);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.source != nextProps.source) {
      this.curId = this.curId+1 == this.source.length ? 0:this.curId+1;
      this.source[this.curId] = nextProps.source;
    }
    return true;
  }

  // computeDisplay(index){
  //   if(index==this.curId+1){
  //     return 'flex';
  //   }
  //   if(index==0 && this.curId==this.source.length-1){
  //     return 'flex';
  //   }
  //   return 'none';
  // }


  computeOpacity(index){
    if(index==this.curId+1){
      return 1; //petit
    }
    if(index==0 && this.curId==this.source.length-1){
      return 1;
    }
    return 0;
  }

  render(){
    return(
      <View>
        { this.source.map((value, index) =>
          <Image 
            key={index}
            // style={[this.props.style, { display:this.computeDisplay(index) }]}
            style={[this.props.style, { opacity:this.computeOpacity(index) }]}
            source={ this.source[index] }
            resizeMode="stretch"
          />
        )}
      </View>
    );
  }
}

//-----------------------------------------------------------------------------------------
export default class App extends Component<Props> {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    this.state = {
      sdcard:false, // chkreugneugneu
      devices: [],
      connectedTo:false,
      img:false,
      imgLocal: false,
      imgTest:false,//'file:///'+RNFetchBlob.fs.dirs.DCIMDir+'/test.jpg',
      // cam:false,
      // TEST 
      cam:true,
      distantcam:false,
      previewing:false,
      distantRec:false,

      isRecording:false,
      motionDetected:false,
      motionBase64:'',
      motionDetectionMode: 1,
      threshold : 0xa0a0a0,
      sampleSize : 30,
      minimumPixels: 1,
      motionPreviewPaused:false,

      recordOptions: {
        path: RNFetchBlob.fs.dirs.DCIMDir+'/Spipoll/record.mp4',
        mute: false,
        maxDuration: 5,
        quality: RNCamera.Constants.VideoQuality['288p'],
      },

      zoom:0,
      freshImages:false,

      showDraggable: true,
      dropAreaValues: null,
      pan: new Animated.ValueXY(),
      opacity: new Animated.Value(1),

      motionInputAreaShape:'elipse',
      motionInputAreaStyle:{
        top: 30,
        left: 30,
        width: previewWidth - 30 - 30,
        height: previewHeight - 30 - 30,
      },



    };

    this.poignee = [{
        x:30,
        y:30,
      },{
        x:previewWidth - 30, 
        y:previewHeight - 30,
      }];

    this.camRequested = false;
    this.stopRecordRequested = false;
    this.safeIds = [
      '6b16c792365daa8b',  //  s6
      'add41fbf38b95c65',  //  s9
    ]
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
      ])
      SplashScreen.hide();
/*
  LDPI: Portrait: 200x320px. 
  MDPI: Portrait: 320x480px.
  HDPI: Portrait: 480x800px. 
  XHDPI: Portrait: 720px1280px. 
  XXHDPI: Portrait: 960px1600px.
  XXXHDPI: Portrait: 1280px1920px
*/
      if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      &&  granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
      // &&  granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
      ){
        // Create splipoll folder.
        RNFetchBlob.fs.isDir( RNFetchBlob.fs.dirs.DCIMDir+'/Spipoll')
        .then((isDir) => {
          if(!isDir){
            RNFetchBlob.fs.mkdir(RNFetchBlob.fs.dirs.DCIMDir+'/Spipoll')
            .then(() => { console.log(RNFetchBlob.fs.dirs.DCIMDir+'/Spipoll' ) })
            .catch((err) => { console.log(err) })
          }
        })
      }
      else {
        // Exit app.
      }

    } catch (err) {
      console.warn(err)
    }
  }


 // _handlePanResponderEnd = (event: PressEvent, gestureState: GestureState) => {
 //  alert(""+gestureState.dx+" - "+gestureState.dy);
 //    this.state.pan.setValue({ x:gestureState.dx, y:gestureState.dy});
 //  };

  componentWillMount() {
    StatusBar.setHidden(true);

    // Add a listener for the delta value change
    this._val = { x:0, y:0 }
    this.state.pan.addListener((value) => this._val = value);

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (e, gesture) => true,
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
    NativeModules.Battery.getLevel()
    .then((level) => {
      console.log(level);
      if(level<15) {
        // TODO send alert to distant.
      }
    })
  }
  // getBatteryLevel = (callback) => {
  //   NativeModules.Battery.getBatteryStatus(callback);
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

  // toggleStorage() {
  //   this.setState({sdcard:!this.state.sdcard});
  // }
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
    if(id){
      BluetoothCP.sendMessage(JSON.stringify({key:key , value:value }), id);
    }
  }

  receivedMessage = (user) => {
    // alert(JSON.stringify(user , undefined, 2));
    let msg = user.message;
    msg = JSON.parse(msg);

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
        this.camRequested = true;
      } 
      
      if(msg.value=='takePicture'){
        this.takePicture();
      }
      else if(msg.value=='startRecording'){
        this.stopRecordRequested = false;
        this.recordVideo();
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
      this.setState({img:'data:image/png;base64,'+msg.value}, function(){
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
    if (this.state.motionPreviewPaused) 
      return;
    
    console.log('MOTION', motion);
    this.setState({
      motionDetected:motion.motionDetected,
      motionBase64: motion.motionBase64,
    }, function(){
      //
    });  

    if (motion.motionDetected){
      //    1. photo every X sec.   for X sec.   /  until no motion
      //    2. video                for X sec.   /  until no motion
    }
  }


  takePicture = async () => {
    if (this.camera) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);
          // console.log(granted);

        if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        &&  granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED){

          try {
            var picture = await this.camera.takePictureAsync({ 
              width:400,
              quality: 0.9, 
              skipProcessing :true,
              fixOrientation: true,
            });
            // console.log(picture);
            
            const filename = this.formatedDate()  + '.jpg';
            RNFetchBlob.fs.mv(
              picture.uri.replace('file://',''),
              RNFetchBlob.fs.dirs.DCIMDir+'/Spipoll/'+filename
            );

            // this.sendMessage(this.state.connectedTo, 'img', picture.base64);
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
    if (this.camera) {
      try {
        const path = this.state.sdcard
        ? RNFetchBlob.fs.dirs.SDCardDir+'/Spipoll/' + this.formatedDate()  + '.mp4'
        : RNFetchBlob.fs.dirs.DCIMDir+'/Spipoll/' + this.formatedDate()  + '.mp4';

        const promise = this.camera.recordAsync({
          path: path,
          maxDuration:60, // TODO user settings.
        });

        if (promise) {
          this.sendMessage(this.state.connectedTo, 'distantRec', true);
          this.setState({ isRecording: true });

          const {uri} = await promise;

          if (this.stopRecordRequested) {
            this.sendMessage(this.state.connectedTo, 'distantRec', false);
            this.setState({ isRecording: false });
          }
          else {
            this.takeVideo();
          }
        }

      }
      catch (err) {
        alert(JSON.stringify({'recording error':err}, undefined, 2));
        this.setState({isRecording:false});
        this.sendMessage(this.state.connectedTo, 'distantRec', false);
      }
    }
  };


  renderMotion(){
    return (
      <View style={styles.MotionContainer} pointerEvents="none">
        {
          this.state.motionBase64
          ? this.state.freshImages 
            ? (
              <FreshImages
                style = {styles.motionpreview}
                source={{uri: 'data:image/png;base64,' + this.state.motionBase64}}
              />
              )
            : (
              <Image
                style = {styles.motionpreview}
                source={{uri: 'data:image/png;base64,' + this.state.motionBase64}}
              />
              )
          :null
        }
      </View>
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

  renderCamera() {
    if(!this.state.cam) {
      if(this.state.connectedTo && this.camRequested){
        this.camRequested = false;
        this.sendMessage(this.state.connectedTo, 'distantcam', false);
      }
      return null;     
    }

    // console.log(this.state.motionInputAreaStyle);
    return (
      <View //ViewShot
        ref="viewShot"
        // options={{
        //   format: "jpg", 
        //   quality:1 ,
        // }}
      >
      <RNCamera
        ref={cam => (this.camera = cam)}
        style = {styles.cam}
        onCameraReady = {this.onCameraReady}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        ratio="4:3"
        autoFocus ={RNCamera.Constants.AutoFocus.on}
        zoom={this.state.zoom}

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
            
        { this.state.motionInputAreaShape != '' ?

          <View style={styles.MotionContainer}>

            { this.state.motionInputAreaShape=='elipse'
              ? <Image 
                  pointerEvents="none"
                  source = {source}
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
                top:this.state.motionInputAreaStyle.top + this.state.motionInputAreaStyle.height,
                left:0,
                right:0,
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
                  style={[
                    styles.motionInputArea, 
                    this.state.motionInputAreaStyle, 
                    {borderWidth:2, borderColor:'transparent'}
                  ]}
                  pointerEvents="none"
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
            />
            <Draggable
              onMove = {(value) => this.onMovePoignee(1, value) }
              initialPos = {{x:this.state.motionInputAreaStyle.left+this.state.motionInputAreaStyle.width,
                             y:this.state.motionInputAreaStyle.top+this.state.motionInputAreaStyle.height}}
            />
          </View>
          :null
        }

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

        {/*
        <View style={styles.iconButtonContainer} >
          <FontAwesomeIcons.Button   
            name='th' //h   th-large   adjust   
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

          <View style={styles.iconButton2}>
          <MaterialCommunityIcons.Button   
            name='camera'
            underlayColor={greenSuperLight}
            size={40}
            width={100}
            margin={0}
            paddingLeft={30}
            color= {greenFlash}
            backgroundColor ={'transparent'}
            // onPress = {() =>{}}
            onPress = {() => this.takePicture()}
          /></View>

          <View style={styles.iconButton2}>
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

          <View style={styles.iconButton2}>
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
        </View>
        */}

       </RNCamera>
      {/*
      <View ref="black_mask_to_save_battery"
        style={{position:'absolute', backgroundColor:'black', top:0,bottom:0,left:0,right:0}}
      />
      */}
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
        style={styles.captureLocalView} 
        source={{uri:this.state.imgTest}}
      />
    );
  }
  

  renderImage(){ // distant image
    if (!this.state.img) return null;
    return(
      <Image 
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
    if(minimumPixels > previewHeight/value){
      minimumPixels = previewHeight/value;
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

  render() {
    console.log('render');
    const panStyle = {
      transform: this.state.pan.getTranslateTransform()
    }

    return (

      <View style={styles.container}>
      <ScrollView style={styles.scroll}>

        {/*        
        <Image
          ref="bug"
          style={{width:50, height:50,}} 
          source={source}
        />
        */}


        <View style={styles.containerPreview}>
          {/*        
            { this.renderImage() }
            { this.renderImageTest() }
            { this.renderImageLocal() }
          */}

          { this.renderCamera() }
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

        <View style={styles.header}>

          <CollectionForm />
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
          <TouchableHighlight
            onPress = {() => this.setState({freshImages: !this.state.freshImages}) }
            >
            <View style={{flexDirection:'row', padding:5,}}>
              <CheckBox value={this.state.freshImages} />
              {/* 
              You can change the color directly in XML. Use buttonTint for the box: (as of API level 23)

              <CheckBox
                  android:layout_width="wrap_content"
                  android:layout_height="wrap_content"
                  android:buttonTint="@color/CHECK_COLOR" />
              You can also do this using appCompatCheckbox v7 for older API levels:

              <android.support.v7.widget.AppCompatCheckBox 
                  android:layout_width="wrap_content" 
                  android:layout_height="wrap_content" 
                  app:buttonTint="@color/COLOR_HERE" /> 
              */}

              <Text style={{color:this.state.freshImages ? greenFlash : greenDark, padding:5,}}>
                Accentuer l'affichage
              </Text>
            </View>
          </TouchableHighlight>

          <Slider  
            ref="sampleSize"
            style={styles.slider} 
            thumbTintColor = '#000' 
            minimumTrackTintColor='#cccccc' 
            maximumTrackTintColor='#ffffff' 
            minimumValue={-parseInt(previewHeight/10,10)}
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
            maximumValue={previewHeight/this.state.sampleSize}
            step={1}
            value={this.state.minimumPixels}
            onValueChange={(value) => this.onMinimumPixels(value)} 
          />
        </View>


      </ScrollView>
      </View>
    );
  }
}

let CIRCLE_RADIUS = 15;
const styles = StyleSheet.create({ 
  motionInputArea:{
    position:'absolute',
  },
  motionInputAreaMask:{
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mainContainer: {
    height:500,
    backgroundColor:'red',
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
    left:0,
    right:0,
    backgroundColor:'#808088',
  },
  slider:{
    padding:10,
    // transform: [{ rotate: '180deg'}],
  },
  sliderDenoise:{
    padding:10,
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
    width: previewWidth, 
    height: previewHeight, 
    margin:1,
  },
  captureLocalView:{
    width: previewWidth, 
    height: previewHeight,
    position:'relative',
    // opacity:0,
  },
  captureLocal:{
    position:'absolute',
    top:0,
    left:0,
    width: previewWidth, 
    height: previewHeight, 
    // transform: [{ rotate: '90deg'}],
    resizeMode: 'contain', //enum('cover', 'contain', 'stretch', 'repeat', 'center')
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'red',

  },
  motionpreview:{
    position:'absolute',
    width: previewWidth, 
    height: previewHeight, 
    resizeMode: 'contain', //enum('cover', 'contain', 'stretch', 'repeat', 'center')
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'red',
  },
  capture:{
    width: previewWidth, 
    height: previewHeight, 
    transform: [{ rotate: '90deg'}],
    resizeMode: 'stretch', //enum('cover', 'contain', 'stretch', 'repeat', 'center')
    borderWidth: 1, borderColor: 'red'
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
    position:'absolute',
    bottom:20,
    left:0,
    right:0,
    padding:5,
    flexDirection:'row',
    // justifyContent: 'space-between',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconButton2:{
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

  row: {
    flexDirection: 'row',
  },

 
});

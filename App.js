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
    Button,
    Alert,
    Image,
    PermissionsAndroid,
    NativeModules,
    PixelRatio,
    Slider,
    StatusBar,
} from 'react-native';
import KeepScreenOn from 'react-native-keep-screen-on';
import RNFetchBlob from 'rn-fetch-blob';
import { RNCamera } from 'react-native-camera';
import Svg,{ Rect } from 'react-native-svg';
// import ViewShot from "react-native-view-shot";
import BluetoothCP  from "react-native-bluetooth-cross-platform"
// import OpenCV from './src/OpenCV';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
let source;
const _source = resolveAssetSource(require('./img/scr.png'));

if (__DEV__) {
  source = { uri: `${_source.uri}` };   // uri: `file://${_source.uri}?id=${article.id}` 
}
else {
  const sourceAndroid = {uri: 'asset:/scr.png'};//const sourceAndroid = { uri: `file:///android_asset/helloworld.html?id=${article.id}` };
  const sourceIOS = { uri: 'file://${_source.uri}' };
  source = Platform.OS === 'ios' ? sourceIOS : sourceAndroid;
}


// const previewHeight = 132;
// const previewWidth = 99;
const previewHeight = 480;
const previewWidth = 360;


type Props = {};

//-----------------------------------------------------------------------------------------
class FreshImages extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.count = this.props.count ? this.props.count : 4;
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

  // computeOpacity(index){
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
      return 1; petit
    }
    if(index==0 && this.curId==this.source.length-1){
      return 1;
    }

    this.source.length/index;

    return 0;
  }
  render(){
    return(
      <View>
        { this.source.map((value, index) =>
          <Image 
            key={index}
            // style={[this.props.style, { display:this.computeOpacity(index) }]}
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
  constructor(props) {
    super(props);
    this.state = {
      sdcard:false,
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

      motionSvg: [],
      previewSvg: [],
      motionAreas:[],
      motionBase64:false,
      // sampledBase64:false,
      motionDetectionMode: 0,
threshold : 0,
      zoom:0,
      faces:[]
    };

    
      
      this.sampleSize = 30;
      this.minimumPixels = 3;

    this.previous_frame=[];

    this.camRequested = false;
    this.stopRecordRequested = false;
    this.safeIds = [
      '6b16c792365daa8b',  //  s6
      'add41fbf38b95c65',  //  s9
    ]
  }
 
  componentDidMount() {
    // TODO: store a file or take dummy picture on cam ready
    // to force authorisisation dialog since motion detctor need it.

    StatusBar.setHidden(true);
    KeepScreenOn.setKeepScreenOn(true);

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
  //            P2P communcation
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

  onCameraReady = async () => {
    // const getAvailablePictureSizes = await this.camera.getAvailablePictureSizes('4:3');
    // console.log(getAvailablePictureSizes);
    // const getSupportedRatiosAsync = await this.camera.getSupportedRatiosAsync();
    // console.log(getSupportedRatiosAsync);
    // const getPreviewSize = await this.camera.getPreviewSize();
    // console.log(getPreviewSize);

    this.takePicture();
    // TEST SNAPVID
    // inter = setInterval(this.takePt, 5000);
  }

  onMotionDetected = ({ motion }) => {
     // mm = this.state.motionDetectionMode+1;
     // if (mm>5) return;
    console.log('MOTION', motion);

 
    this.setState({
      // imgTest:'file:///'+RNFetchBlob.fs.dirs.DCIMDir+'/test.jpg'+ '?' + new Date(),
      // motionSvg:motion.motionPixels,
      motionBase64: motion.motionBase64,
      motionBase64clean:motion.motionBase64clean,
      // motionArea:{x:motion.motionArea[0],y:motion.motionArea[1],w:motion.motionArea[2],h:motion.motionArea[3]},
      // motionAreas:motion.motionAreas,

      // previewSvg:motion.sampled,
      // sampledBase64:motion.sampledBase64,
      // motionDetectionMode:mm,
    }, function(){
      console.log('motionBase64 length',this.state.motionBase64.length);

      console.log('motionPixels length',this.state.motionSvg.length);
    });    
  }

  onFacesDetected = ({ faces }) => {
    console.log('FACE', faces);
    this.setState({ faces:faces });
  }

  onFaceDetectionError = state => console.warn('Faces detection error:', state)

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
              quality: 0.7, 
              // base64: true, 
              fixOrientation: true,
            });
            console.log(picture);
            
            var filename = picture.uri.split('/');

            filename = filename[filename.length-1];
            RNFetchBlob.fs.mv(
              picture.uri.replace('file://',''),
              RNFetchBlob.fs.dirs.DCIMDir+'/splipoll_'+filename
            );



            // this.sendMessage(this.state.connectedTo, 'img', picture.base64);
          } 
          catch (err) {
            // console.log('takePictureAsync ERROR: ', err);
          }
        } else {
         // console.log('REFUSED');
        }
      } catch (err) {
        // console.warn(err)
      }
    }
  }
                  // Test local snapshot while video recording.
                  takePt = async () => {
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
                              quality: 0.7, 
                              // base64: true, 
                              fixOrientation: true,
                            });
                            // alert(JSON.stringify(picture, undefined, 2));


                            this.setState({img:picture.uri});

                          } 
                          catch (err) {
                            // console.log('takePictureAsync ERROR: ', err);
                          }
                        } else {
                         // console.log('REFUSED');
                        }
                      } catch (err) {
                        // console.warn(err)
                      }
                    }
                  };

  async recordVideo(){
    if (this.camera) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        ]);
          // console.log(grantedA);

        if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        &&  granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        &&  granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ){
   
          try {

            this.sendMessage(this.state.connectedTo, 'distantRec', true);
            const path = this.state.sdcard
              ? RNFetchBlob.fs.dirs.SDCardDir+'/p2p_' +  Date.now() + '.mp4'
              : RNFetchBlob.fs.dirs.DCIMDir+'/p2p_' +  Date.now() + '.mp4';

            const {uri} = await this.camera.recordAsync({
              path: path,
              maxDuration: 180,
            });

            if (this.stopRecordRequested) {
              //alert('record uri:'+uri); // file:///data/user/0/com.btcontrol/cache/Camera/***.mp4
              this.sendMessage(this.state.connectedTo, 'distantRec', false);
            }
            else {
              this.recordVideo();
            }
          } 
          catch (err) {
            alert(JSON.stringify({'recording error':err}, undefined, 2));
          }
        } else {
           alert('REFUSED');
        }
      } catch (err) {
        // console.warn(err)
      }
    }
  };

  renderFace({ bounds, faceID, rollAngle, yawAngle }) {
    return (
      <View
        key={faceID}
        transform={[
          { perspective: 600 },
          { rotateZ: `${rollAngle.toFixed(0)}deg` },
          { rotateY: `${yawAngle.toFixed(0)}deg` },
        ]}
        style={[
          styles.face,
          {
            ...bounds.size,
            left: bounds.origin.x,
            top: bounds.origin.y,
          },
        ]}
      >
        {/*
        <Text style={styles.faceText}>ID: {faceID}</Text>
        <Text style={styles.faceText}>rollAngle: {rollAngle.toFixed(0)}</Text>
        <Text style={styles.faceText}>yawAngle: {yawAngle.toFixed(0)}</Text>
        */}
      </View>
    );
  }

  renderFaces() {
    return (
      <View style={styles.facesContainer} pointerEvents="none">
        {this.state.faces.map(this.renderFace)}
      </View>
    );
  }

  renderMotionArea(motionArea) {
    return (
        <View 
          style={[
            styles.motionArea,
            {
              left: motionArea.x,
              top: motionArea.y,
              width: motionArea.w,
              height: motionArea.h,
            },
          ]}
        ></View>
    );
  }


  renderMotion(){
    console.log('renderMotion');
    if(this.state.motionAreas.length == 0) return null;
    console.log(this.state.motionArea);
    return (
      <View pointerEvents="none">
        <Svg
         style={styles.motionpreview} 
        >
          { /*
            this.state.motionSvg.map((value, index) => 
          <Rect
            key={index}
            x={ value.x }
            y={ value.y }
            height= {this.sampleSize}
            width={this.sampleSize}
            strokeWidth={0}
            fill={"rgb("+value.score +","+ value.score +","+ value.score+")"}
          />
          )
*/        }
        </Svg>

        <View style={styles.facesContainer} pointerEvents="none">

        {this.state.motionAreas.map(this.renderMotionArea)}
      
{/*
        <View 
          style={[
            styles.motionArea,
            {
              left: this.state.motionArea.x,
              top: this.state.motionArea.y,
              width: this.state.motionArea.w,
              height: this.state.motionArea.h,
            },
          ]}
        ></View>
        */}
        </View>

        <View style={styles.facesContainer} pointerEvents="none">
        {
          this.state.motionBase64 ? (
        <FreshImages 
          style = {[styles.motionpreview,{position:'absolute'}]}
          source={{uri: 'data:image/png;base64,' + this.state.motionBase64}}
        />
        ):null
        }
        </View>

        <View style={styles.facesContainer} pointerEvents="none">
        {
          this.state.motionBase64clean ? (
        <FreshImages 
          style = {[styles.motionpreview,{position:'absolute'}]}
          source={{uri: 'data:image/png;base64,' + this.state.motionBase64clean}}
        />
        ):null
        }
        </View>

      </View>
    );
  }

  renderCamera() {
    if(!this.state.cam) {
      if(this.state.connectedTo && this.camRequested){
        this.camRequested = false;
        this.sendMessage(this.state.connectedTo, 'distantcam', false);
      }
      return null;     
    }

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
        permissionDialogTitle={'Permission to use camera'}
        permissionDialogMessage={'We need your permission to use your camera phone'}
        ratio="4:3"
        autoFocus ={RNCamera.Constants.AutoFocus.on}
        // focusDepth = {0}
        onFacesDetected={this.onFacesDetected}
        onFaceDetectionError={this.onFaceDetectionError}  


        // onMotionDetected={this.onMotionDetected}
        // motionDetectionMode={this.state.motionDetectionMode}

        // default out BOOLEAN  0
        // in MULTI_THRESHOLD   1
        // out MOTION_AREAS     2
        // ... MOTION_PIXELS    4
        // MOTION_BASE64        8
        // MOTION_PATH          16
        // SAMPLED_PIXELS       32
        // SAMPLED_BASE64       64
        // SAMPLED_PATH         128
        // GROUP_COUNT          256
        // GROUP_SIZES          512
        // GROUPED_PIXELS       1024
        
        motionDetectionMinimumPixels={3}
        motionDetectionThreshold={this.state.threshold}
        motionDetectionSampleSize={this.sampleSize}

        zoom={this.state.zoom}
        >

        {/*this.renderFaces()*/}

        {this.renderMotion()}
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

  // onloadimg (id) {
  //   console.log('onloadimg '+ id);
  //   // setTimeout( 
  //   //   () => {
  //       this.setState({imgLocal0 : this.state.imgLocal0 ? 0 : 1}, function(){
  //       })
  //   // }
  //   // , 1);
  //   //this.motionDetect();
  // }

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
        // onLoad={this.onloadimg}
      />
    );
  }
  
  renderImageLocal(){
    // if (this.state.imgLocal.length==0) return null;
    if (!this.state.imgLocal) return null;
    return(
      <View 
        style = {styles.captureLocalView}
        >
          <Image 
            style = {styles.captureLocal}
            source={{uri:this.state.imgLocal}} 
            // source={{uri: 'asset:/scr.png'}}
            // onLoad= { () => this.onloadimg(0) }
          />

{/*
        {this.state.imgLocal.length >= 1 ? (
          <Image 
            style = {[styles.captureLocal, {borderColor:'blue', opacity:this.state.imgLocal0?1:0}]}
            source={{uri:this.state.imgLocal[0]}} 
            // source={{uri: 'asset:/scr.png'}}
            onLoad= { () => this.onloadimg(0) }
          />
        ) : null}

        {this.state.imgLocal.length >= 2 ? (
          <Image 
            style = {[styles.captureLocal, {borderColor:'red', opacity:this.state.imgLocal0?0:1}]}
            source={{uri:this.state.imgLocal[1]}} 
            // source={{uri: 'asset:/scr.png'}}
            onLoad= { () => this.onloadimg(1) }
          />
        ) : null}
*/}
      </View>
    );
  }

  renderOtherButtons(value){
    if(!value.connected || !this.state.distantcam) return null;
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
    if(!value.connected) return null;
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

  onThreshold0( color) {
   

    this.setState({threshold: color });


    console.log();
    console.log(this.state.threshold  >>> 16 );
    console.log((this.state.threshold & 0x00ff00) >>> 8  );
    console.log(this.state.threshold & 0x0000ff);
    console.log();
  }

  onThreshold(mask, color) {
    const threshold = this.state.threshold & ~mask | color;
    this.setState({threshold:threshold});
  }
  onMinimumPixels(value) {
    this.minimumPixels = value;
  }
  onSampleSize(value) {
    this.sampleSize = value;
  }
  onZoom(value) {
    this.setState({zoom:value});
  }

  render() {
    console.log('render');
    console.log(this.state.threshold.toString(16));
console.log(
    (
      (this.state.threshold>>>16) 
    + ((this.state.threshold&0x00ff00)>>>8)
    + (this.state.threshold&0x0000ff)
    )/3
);
    return (
      <View style={styles.container}>
      <ScrollView style={styles.scroll}>

        <Button 
          style={{ 
            margin:1, 
            height:40 ,
            marginBottom:2,
          }}
          color={ this.state.previewing ? '#338433' : 'grey'}
          title = 'TAKE'
          onPress = {() => this.takePicture()}
        />

        <View style={styles.header} >
            <Slider  
              ref="zoom"
              style={styles.slider} 
              thumbTintColor = '#000' 
              minimumTrackTintColor='#ff0000' 
              maximumTrackTintColor='#0000ff' 
              minimumValue={0}
              maximumValue={1}
              step={0.1}
              value={0}
              onValueChange={
                (value) => this.onZoom(value)
              } 
            />

            <Slider  
              ref="sampleSize"
              style={styles.slider} 
              thumbTintColor = '#000' 
              minimumTrackTintColor='#ff0000' 
              maximumTrackTintColor='#0000ff' 
              minimumValue={3}
              maximumValue={parseInt(previewHeight/10,10)}
              step={1}
              value={this.sampleSize}
              onValueChange={
                (value) => this.onSampleSize(value)
              } 
            />

            <Slider  
              ref="threshold"
              style={styles.slider} 
              thumbTintColor = '#000' 
              minimumTrackTintColor='#ff0000' 
              maximumTrackTintColor='#0000ff' 
              minimumValue={0}
              maximumValue={255}
              step={1}
              // value={this.state.threshold}
              value={
                (
                  (this.state.threshold>>>16) 
                + ((this.state.threshold&0x00ff00)>>>8)
                + (this.state.threshold&0x0000ff)
                )/3
              }
              onValueChange={(value) => this.onThreshold(0xffffff, (value<<16)|(value<<8)|value)  } 
            />
              <Slider  
                ref="threshold_red"
                style={styles.slider} 
                thumbTintColor = '#f00' 
                minimumTrackTintColor='#ff0000' 
                maximumTrackTintColor='#0000ff' 
                minimumValue={0}
                maximumValue={255}
                step={1}
                value={this.state.threshold>>>16}
                onValueChange={(value) => this.onThreshold(0xff0000, value<<16)} 
              />
              <Slider  
                ref="threshold_green"
                style={styles.slider} 
                thumbTintColor = '#0f0' 
                minimumTrackTintColor='#ff0000' 
                maximumTrackTintColor='#0000ff' 
                minimumValue={0}
                maximumValue={255}
                step={1}
                value={(this.state.threshold & 0x00ff00) >>> 8}
                onValueChange={(value) => this.onThreshold(0x00ff00,value<<8)} 
              />
              <Slider  
                ref="threshold_blue"
                style={styles.slider} 
                thumbTintColor = '#00f' 
                minimumTrackTintColor='#ff0000' 
                maximumTrackTintColor='#0000ff' 
                minimumValue={0}
                maximumValue={255}
                step={1}
                value={(this.state.threshold & 0x0000ff)}
                onValueChange={(value) => this.onThreshold(0x0000ff,value)} 
              />

            <Slider  
              ref="minimum_pixels"
              style={styles.slider} 
              thumbTintColor = '#000' 
              minimumTrackTintColor='#ff0000' 
              maximumTrackTintColor='#0000ff' 
              minimumValue={1}
              maximumValue={200}
              step={1}
              // value={this.minimumPixels}
              onValueChange={
                (value) => this.onMinimumPixels(value)
              } 
            />
        </View>
        <View style={styles.containerPreview}>


                {/*        <Svg
                          style = {styles.motionpreview}
                        >
                          { this.state.previewSvg.map((value, index) => 
                          <Rect
                            key={index}
                            x={ this.sampleSize * ( Math.trunc(index/Math.trunc(previewHeight/this.sampleSize)) % Math.trunc(previewWidth/this.sampleSize))}
                            y={this.sampleSize * (index%(Math.trunc(previewHeight/this.sampleSize))) }
                            height= {this.sampleSize}
                            width={this.sampleSize}
                            strokeWidth={0}
                            fill={'#'+value}
                          />
                          )}
                        </Svg>
                

        { this.renderImage() }
        { this.renderImageTest() }
        { this.renderImageLocal() */}
        { this.renderCamera() }

        </View>
        
        { this.state.devices.map((value, index) => 
          <View 
            key={index}
            style={{flexDirection:'row'}}
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

      </ScrollView>
      </View>
    );
  }
}


const styles = StyleSheet.create({ 
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


  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
  face: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    borderColor: '#FFD700',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  motionArea: {
    padding: 1,
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    borderColor: '#00D7FF',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  landmark: {
    width: 2,
    height: 2,
    position: 'absolute',
    backgroundColor: 'red',
  },
  faceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
});

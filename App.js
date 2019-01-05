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
import ViewShot from "react-native-view-shot";
import BluetoothCP  from "react-native-bluetooth-cross-platform"

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


const previewHeight = 132;
const previewWidth = 99;
const landmarkSize = 2;

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      sdcard:false,
      devices: [],
      connectedTo:false,
      img:false,
      imgLocal: false,
      // cam:false,
      // TEST 
      cam:true,
      distantcam:false,
      previewing:false,
      distantRec:false,

      motionSvg: [],
      previewSvg: [],

      faces:[]
    };

    
      this.threshold = 50;
      this.sampleSize = 5;

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

  toggleStorage() {
    this.setState({sdcard:!this.state.sdcard});
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

  motionDetect = async () => {
    console.log('motionDetect()');
    if (this.camera) {

      this.refs.viewShot.capture().then(uri => {
        // console.log(uri);
        // const new_uri = RNFetchBlob.fs.dirs.CacheDir+'/snapshot.jpg';

        // Copy snapshot.
        // RNFetchBlob.fs.cp(uri.replace('file://',''), RNFetchBlob.fs.dirs.DCIMDir+'/' + Date.now()+ '.jpg')
        // .then(() => {console.log('cop')})
        // .catch(() => {console.log('cop err')})

        // Snapshot is somtimes bigger than expected. 
        // NativeModules.Bitmap.getPixels(uri.replace('file://',''), this.sampleSize, previewWidth, previewHeight)
        NativeModules.Bitmap.getMotion(uri.replace('file://',''), this.sampleSize, this.threshold, previewWidth, previewHeight)
        .then((image) => {
          // console.log(' NativeModules.Bitmap' + uri.replace('file://',''));
          // console.log(this.sampleSize);
          // console.log(image);

          var motionSvg = [];
          var previewSvg = [];
          // loop:


// Ca deconne avec threshold 4
//           {pixels: Array(884), hasAlpha: false, height: 138, width: 105}
// 
// height: 138
// width: 105
// pixels: (884) 

/*
          for (let offset = 0; offset < image.pixels.length; offset++) {
          // for (let x = 0; x < image.width/this.sampleSize; x++) {
          //   for (let y = 0; y < image.height/this.sampleSize; y++) {

              // const offset = image.height * x + y;
              const pixel = image.pixels[offset]; //ff 58 4e 45
              // offset++;
              // console.log(offset+ ' - ' +pixel)
              // console.log(pixel);
              const r = parseInt(pixel.substr(0, 2), 16);

              previewSvg.push({
                // x:x*previewWidth/image.width,
                // y:y*previewHeight/image.height, 
                pixel:'#'+pixel,
              });

              // first check if it's not the first frame, but 
               // seeing of when the previous_frame array 
              // is not we empty, and then only draw something if there's 
              // a significant colour difference 
              if( this.previous_frame[offset] 
              && Math.abs(this.previous_frame[offset] - r) > this.threshold) {

                console.log('! Motion Detected !');
                // break loop;

                // show on svg
                motionSvg.push({
                  //x:x,y:y,
                  pixel:Math.abs(this.previous_frame[offset] - r)});
              }

              // store these colour values to compare to the next frame
              this.previous_frame[offset] = r;    
          //   }
          // }
          }
         */


          this.setState({
            // imgLocal: uri,
            motionSvg:image.motionPixels,
            previewSvg: image.samplePixels,
          }, function(){
            this.motionDetect();
          });
        

        })
        .catch((err) => {
           console.log('NativeModules.Bitmap ERROR');
          console.error(err);
        });
        // end NativeModules.Bitmap.


          // Delete privous snap.
          // if(typeof imgLocal[this.state.imgLocal0] !== undefined){
          //   RNFetchBlob.fs.unlink(imgLocal[this.state.imgLocal0].replace('file://',''))
          //   .then(() => {
          //     // this.refs['LOCALIMG'].setNativeProps({
          //     //   source:{uri:uri}
          //     // });
          //     //    this.setState({imgload:Date.now()});
          //     imgLocal[this.state.imgLocal0] = uri;
          //     this.setState({imgLocal: imgLocal}, function(){
          //       // setTimeout( this.motionDetect, 1);
          //       // this.motionDetect();
          //     });
          //   })
          //   .catch((err) => {  
          //     console.log('delete failed ' +  this.state.imgLocal) 
          //   })
          // }
          // else{
          //   imgLocal[this.state.imgLocal0] = uri;
          //   this.setState({imgLocal: imgLocal}, function(){
          //     // setTimeout( this.motionDetect, 1);
          //     // this.motionDetect();
          //   });
          // }

      });
    }
  };

  componentDidUpdate(){

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
              quality: 0.7, 
              base64: true, 
              fixOrientation: true,
            });
            console.log(picture);
            this.sendMessage(this.state.connectedTo, 'img', picture.base64);
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



  toggleRecord(){
    if(this.state.distantRec){
      this.sendMessage(this.state.connectedTo, 'cmd', 'stopRecording');
    }
    else{
      this.sendMessage(this.state.connectedTo, 'cmd', 'startRecording');
    } 
  }

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



 onloadimg (id) {
  console.log('onloadimg '+ id);
  // setTimeout( 
  //   () => {
      this.setState({imgLocal0 : this.state.imgLocal0 ? 0 : 1}, function(){
        this.motionDetect();
      })
    // }
    // , 1);
    //this.motionDetect();


}

  renderImage(){
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

  onCameraReady = async () => {
    // this.takePicture();
    // TEST SNAPVID
    // inter = setInterval(this.takePt, 5000);

    // TEST MOTIOM
    // setTimeout( this.motionDetect, 1000);
    // this.motionDetect();
   
  }



                    onMotionDetected = ({ motion }) => {
                      console.log('MOTION', motion);
                      if(typeof motion != undefined){
                        this.setState({ motionSvg:motion });
                      }
                      
                    };

                    onFacesDetected = ({ faces }) => {
                      console.log('FACE', faces);
                      this.setState({ faces:faces });
                    };

                    onFaceDetectionError = state => console.warn('Faces detection error:', state);

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


  renderCamera() {
    if(!this.state.cam) {
      if(this.state.connectedTo && this.camRequested){
        this.camRequested = false;
        this.sendMessage(this.state.connectedTo, 'distantcam', false);
      }
      return null;     
    }

    return (
      <ViewShot 
        ref="viewShot"
        options={{
          format: "jpg", 
          quality:1 ,
          // width: previewWidth/ PixelRatio.get(),
          // height:previewHeight/ PixelRatio.get(),
        }}
      >
      <RNCamera
        ref={cam => (this.camera = cam)}
        style = {styles.cam}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        permissionDialogTitle={'Permission to use camera'}
        permissionDialogMessage={'We need your permission to use your camera phone'}
        ratio="4:3"
        // autoFocus ={RNCamera.Constants.AutoFocus.off}
        // focusDepth = {1}

        onCameraReady = {this.onCameraReady}
        onFacesDetected={this.onFacesDetected}
        onFaceDetectionError={this.onFaceDetectionError}  
        onMotionDetected={this.onMotionDetected}
        >

        {this.renderFaces()}

      </RNCamera>
      </ViewShot>
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

  onThreshold(value) {
    this.threshold = value;
  }
  onSampleSize(value) {
    this.sampleSize = value;
  }

  render() {
    console.log('render');
    return (
      <View style={styles.container}>
      <ScrollView style={styles.scroll}>

        <View style={styles.header} >
            <Slider  
              ref="sampleSize"
              style={styles.slider} 
              thumbTintColor = '#000' 
              minimumTrackTintColor='#ff0000' 
              maximumTrackTintColor='#0000ff' 
              minimumValue={parseInt(previewWidth/20,10)}
              maximumValue={parseInt(previewWidth/8,10)}
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
              maximumValue={200}
              step={1}
              value={this.threshold}
              onValueChange={
                (value) => this.onThreshold(value)
              } 
            />
        </View>
{/*      
      <Image
          style={{
            backgroundColor: '#ccc',
            flex:0.5,
            resizeMode:'stretch',
            position: 'absolute',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
          }}
          source={source}  //{uri: 'asset:/scr.png'}
        />
*/}
{/*
        <Button 
          style={{ 
            margin:1, 
            height:40,
            marginBottom:2,
          }}
          title = {this.state.sdcard ? 'CARD' : 'PHONE'}
          color = 'grey'
          onPress = {() => this.toggleStorage()}
        />
*/}
        <View style={styles.containerPreview}>


        <Svg
         style={styles.motionpreview} 
        >
          { this.state.motionSvg.map((value, index) => 
          <Rect
            key={index}
            x={ value.x/2.42 }
            y={ value.y/2.42 }
            height= {this.sampleSize}
            width={this.sampleSize}
            strokeWidth={0}
            // fill={"rgb("+value.score +","+ value.score +","+ value.score+")"}
            fill={'#'+value.color}
          />
          )}
        </Svg>

        <Svg
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
        { this.renderImageLocal() }
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
    height:80,
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
    width:previewWidth/PixelRatio.get(), 
    height:previewHeight/PixelRatio.get(),   
    // width: previewWidth, 
    // height: previewHeight, 
    margin:1,
    borderWidth: 1,
    borderColor: 'red',
  },
  captureLocalView:{
    width: previewWidth, 
    height: previewHeight, 
  
    borderColor: 'red',
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
    // flexDirection:'column',

    width: previewWidth, 
    height: previewHeight, 
    // transform: [{ rotate: '90deg'}],
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
  landmark: {
    width: landmarkSize,
    height: landmarkSize,
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

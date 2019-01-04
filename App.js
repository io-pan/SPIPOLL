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
} from 'react-native';


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

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

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView from 'react-native-maps';
// import DateTimePicker from 'react-native-modal-datetime-picker';

import FooterImage from './footerimage';
import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';
import AdvancedList from './advancedList';

// TODO:  Add locationSelect and others
//        ... at least take it out of CollectionForm.

const 
  pad2 = function(num){
    return num<10 ? '0'+num : ''+num;
  },
  
  deg2dms = function(deg, latlon) {
    if (isNaN(deg)) return false;

    var card = '';
    if(latlon=='lat'){
      card = deg > 0 ? "N" : "S"
    }
    else {
      card = deg > 0 ? "E" : "W"
    }

    deg=Math.abs(deg);
    var d = Math.floor(deg);
    var minfloat = (deg-d)*60;
    var m = Math.floor(minfloat);
    var secfloat = (minfloat-m)*60;
    var s = Math.round(secfloat * 100) / 100;
    // After rounding, the seconds might become 60. These two
    // if-tests are not necessary if no rounding is done.
    if (s==60) {
      m++;
      s=0;
    }
    if (m==60) {
      d++;
      m=0;
    }
    return "" + d + ":" + m + ":" + s + ":" + card;
  },

  dmsFormat = function(dms){
    if (!dms) return '';

    dms = dms.split(':');
    return "" + dms[0] + "°" +dms[1] + "'" + dms[2] + "''" + dms[3];
  }
;// const


//=========================================================================================
export class Form extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
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
          <Text style={this.props.styles.title}>{field.title}</Text>
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
                    ? () => this.props.fieldChanged(field.name, value.value)
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

            <View style={{flexDirection:'row', alignItems:'space-between'}}>
             
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
    };
  }

  render(){
    return null;
  }
}

//=========================================================================================
export class ImagePicker extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    const source = this.props.source;
    source.uri = source.uri.substring(0, 
      source.uri.indexOf('?t=') < 0 
      ? source.uri.length
      : source.uri.indexOf('?t=')
      ) + '?t='+ new Date().getTime();

    this.state = {
      visibleImageView:false,
      source:source,
    };
  }

  setSource(source){
    // console.log(source);
    // console.log(this.state.source);
    source.uri = source.uri.substring(0, 
      source.uri.indexOf('?t=') < 0 
      ? source.uri.length
      : source.uri.indexOf('?t=')
      ) + '?t='+ new Date().getTime();
    console.log('ImagePicker setSource', source);
    this.setState({source:source});
  }

  showImageView = () => {
    // console.log('showImageView');
    this.setState({visibleImageView:true});
  }
  hideImageView = () => {
    this.setState({visibleImageView: false});
  }

  onLayout = (e) => {
    this.setState({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    })
  }
  
  render(){
      return(

        <View style={[ this.props.style,{}]}
          
          >
          <ImageView
            title={this.props.title.replace("\n", " ")}
            visible={this.state.visibleImageView}
            onCancel={this.hideImageView}
            source={this.state.source}
            titleTextStyle={{backgroundColor:this.props.highlightColor, color:'white', fontWeight:'bold',fontSize:16}}
            cancelButtonTextStyle={{backgroundColor:this.props.highlightColor, color:'white', fontWeight:'bold',fontSize:16}}
          />

          <TouchableOpacity 
            style={{
              flex:1,
              alignItems:'center', 
              justifyContent: 'center',
            }}
            onPress = {() => this.props.onPress()}
            onLayout = {this.onLayout} 
            >
            <Text style={{ fontSize:14, color:'grey', height:50, textAlign:'center',
                padding:2,}}>
            {this.props.title}</Text>
            <MaterialCommunityIcons
              name="camera"
              style={{
                backgroundColor:'transparent',
                marginBottom:5,
                color:this.props.highlightColor,
              }}
              size={30}
            />
          </TouchableOpacity>

          { this.state.source
            ? <TouchableOpacity 
              style={{
                alignItems:'center', 
                justifyContent: 'center',
                flex:0.5,
                // borderColor:greenLight, borderWidth:1,
              }} 
              onPress={this.showImageView}
              >
              <Image
                style={{ 
                  width:this.state.width,
                  height:this.state.width,
                }}
                resizeMode="contain"
                source={this.state.source }
              />
            </TouchableOpacity>
          : null
        }
        </View>
      );
  }

} // ImagePicker


//-----------------------------------------------------------------------------------------
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
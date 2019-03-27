import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  Dimensions,
  Animated,
  PermissionsAndroid,
  ScrollView,
  AsyncStorage,
  Modal,
  BackHandler,
  NetInfo,
  CheckBox,
  NativeModules,
} from 'react-native'

import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';
import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView from 'react-native-maps';
import DateTimePicker from 'react-native-modal-datetime-picker';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

// Spipoll data.
import { flowerList } from './flowers.js';
import { insectList } from './insects.js';

const 
  greenDark = "#231f20",
  green = "#bcd151",
  greenLight = "#bcd151",
  greenSuperLight ="#ecf3cd",
  greenFlash = "#92c83e", // "#92c83e"; // b7d432 // bcd151
  purple = "#9d218b",
  flashSessionDuration = 10, // 20*60;

  date2folderName = function(){
    now = new Date();
    year = "" + now.getFullYear();
    month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
    day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
    hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
    minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
    second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }

    return year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + second;
  },

  formatFolderName = function(str, sec){
    const mois = ['', 'janv.', 'fév.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'nov.', 'déc.']
    str = str.split('_');
    d = str[0].split('-');
    t = str[1].split('-');
    return d[2] +  ' ' + mois[parseInt(d[1])] +  ' ' + d[0] + ', ' + t[0]+':'+ t[1] + (sec?':'+t[2] : '');
  },

  formatDate = function(timestamp){
    // 2 janv. 2019
    if(timestamp){
      date = new Date(timestamp);
      const mois = ['janv.', 'fév.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'nov.', 'déc.']
      return date.getDate() + ' ' + mois[date.getMonth()] + ' ' + date.getFullYear();
    }
    return '';
  },

  formatDateSpipoll = function(timestamp){
    // yyyy-mm-dd
    if(timestamp){
      date = new Date(timestamp);
      return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
    }
    return '';
  },

  formatTime = function(timestamp){
    // hh:mm
    if(timestamp){
      date = new Date(timestamp);
      return pad2(date.getHours()) + ':' + pad2(date.getMinutes());
    }
    return '';
  },

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
  };


//-----------------------------------------------------------------------------------------
class ModalPlace extends Component {
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


  // componentDidUpdate() {
  // }

  // componentWillUnmount() {
  // }

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
            backgroundColor:greenFlash, paddingTop:30,paddingBottom:20, 
            color:'white', fontWeight:'bold', fontSize:18,
          }}>
          {this.props.title}
          </Text>
          <MaterialCommunityIcons.Button   
            name="magnify"
            backgroundColor={greenFlash}
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
              style={{flex:1,backgroundColor:greenFlash, borderRightWidth:1, borderRightColor:'white'}}
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


//-----------------------------------------------------------------------------------------
class ImagePicker extends Component {
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
            title={this.props.title}
            visible={this.state.visibleImageView}
            onCancel={this.hideImageView}
            source={this.state.source}
            titleTextStyle={{color:greenFlash, fontWeight:'bold',fontSize:16}}
            cancelButtonTextStyle={{color:greenFlash, fontWeight:'bold',fontSize:16}}
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
                color:greenFlash,
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
class FooterImage extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props) {
    super(props)
    this.state = {
      width:0,
    };

    if (__DEV__) {
      this.footer_source = { uri: `${resolveAssetSource(require('../img/footer.png')).uri}` };
    } else {
      this.footer_source = {uri: 'asset:/img/footer.png'};
    }
  }

  onLayout = (e) => {
    this.setState({
      width: e.nativeEvent.layout.width,
      // height: e.nativeEvent.layout.height,
    })
  }

  render(){
    return(
      <View
        onLayout={this.onLayout}
      >
      <Image 
        style={{width:this.state.width, height:this.state.width*0.65}}
        source={this.footer_source} 
      />
      </View>
    );
  }

}

//-----------------------------------------------------------------------------------------
class ModalHelp extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props) {
    super(props)
    this.state = {}
  }

  render(){
    console.log(this.props);
    return(
     <Modal
        onRequestClose={this.props.onCancel}
        visible={this.props.visible}
      >
        <View style={{flex:1}} >

          <Text style={{ textAlign:'center',
            backgroundColor:greenFlash, paddingTop:30,paddingBottom:20, 
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
              style={{flex:1,backgroundColor:greenFlash, borderRightWidth:1, borderRightColor:'white'}}
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


//-----------------------------------------------------------------------------------------
class Timer extends Component {
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



//-----------------------------------------------------------------------------------------
class InsectForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx);

    this.state = {
      visibleTaxonModal:false,
      insect:{
        taxon_list_id_list:false,
        taxon_name:'',
        comment:'',
        session:false,

      },

    };
  }

  componentDidMount(){

  }

  storeInsect(field,value){
    if(field=='taxon'){
      this.setState({
        insect:{
          ...this.state.insect,
          taxon_list_id_list:value.value,
          taxon_name:value.label,
        },
        visibleTaxonModal: false,
      },function(){
         // TODO: AsyncStorage.setItem(this.props.data.date+'_collection', JSON.stringify( this.state.collection ));
      });
    }
    else{
      this.setState({
        insect:{
          ...this.state.session,
          [field]:value,
        }
      },function(){
         // TODO: AsyncStorage.setItem(this.props.data.date+'_collection', JSON.stringify( this.state.collection ));
      });    
    }

  }

  showTaxonModal = () => {
    this.setState({visibleTaxonModal:true});
  }
  hideTaxonModal = () => {
    this.setState({visibleTaxonModal: false});
  }


  render(){
    return(
        <ScrollView style={{flex:1}}>

              <View style={styles.collection_grp}>
                <Image
                // map photos
                  source={null}
                />
              </View>

              <View style={styles.collection_grp}>
                <TouchableOpacity 
                  style={{
                    overflow:'hidden', marginBottom:10,
                    flexDirection:'row', flex:1, alignItems:'center',
                    backgroundColor:'white', borderColor:'lightgrey', borderWidth:1}} 
                  onPress={this.showTaxonModal}
                  >
                    <MaterialCommunityIcons
                      name="chevron-down" 
                      style={{ color:'white', padding:5, marginRight:5,
                      backgroundColor:greenFlash,
                      }}
                      size={22}
                    />
                  <View style={{overflow:'hidden',flex:1}}>
                  <Text style={{padding:5,
                    fontSize:14,
                    backgroundColor:'white',
                    color:this.state.insect.taxon_list_id_list?greenFlash:'grey'
                    }}>
                    { this.state.insect.taxon_list_id_list
                      ? this.state.insect.taxon_name
                      : 'Je choisis dans la liste'
                    }
                  </Text>
                  </View>
                </TouchableOpacity>      

                <TextInput
                  placeholder='Je connais une dénomination plus précise'
                  placeholderTextColor='grey'
                  style={{ flex:1, padding:5, marginBottom:5,borderWidth:1, 
                    fontSize:14,
                    backgroundColor:'white',
                    color:greenFlash,
                    borderColor:this.state.insect.taxon_extra_info?greenFlash:'lightgrey', }} 
                  defaultValue ={this.state.insect.taxon_extra_info}
                  onEndEditing = {(event) => this.storeInsect('taxon_extra_info',event.nativeEvent.text) } 
                  onSubmitEditing = {(event) => this.storeInsect('taxon_extra_info', event.nativeEvent.text) }                        
                />

                  <TextInput
                    placeholder='Commentaire'
                    // multiline={true}
                    // numberOfLines={3} 
                    placeholderTextColor='grey'        
                    style={{fontSize:14, color:'grey',
                      padding:5, marginTop:15, borderColor:'lightgrey', borderWidth:1,}}
                    defaultValue ={this.state.insect.comment}
                    onEndEditing = {(event) => this.storeInsect('comment',event.nativeEvent.text) } 
                    onSubmitEditing = {(event) => this.storeInsect('comment', event.nativeEvent.text) }  
                  />
              </View>

              <View style={styles.collection_grp}>
              
                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  Nombre maximum d'individus de cette espèce vus simultanément</Text>

                  <View style={{
                    flexDirection:'row',
                    alignItems:'space-between',
                    justifyContent:'center',
                     // alignItems: 'flex-start',
                  }}>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                        borderColor:greenFlash 
                      }}
                      // onPress = {() => this.storeEnvironment('occAttr_3_1528533',108)}
                      ><Text style={{fontSize:14,backgroundColor:'white',
                        // color: this.state.collection.environment.occAttr_3_1528533==108 ? greenFlash : 'grey',
                      }}>
                      1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash
                      }}
                      // onPress = {() => this.storeEnvironment('occAttr_3_1528533',109)}
                      ><Text style={{fontSize:14,
                        // color: this.state.collection.environment.occAttr_3_1528533==109 ? greenFlash : 'grey',
                      }}>
                      Entre 2 et 5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash,
                      }}
                      // onPress = {() => this.storeEnvironment('occAttr_3_1528533',110)}
                      ><Text style={{fontSize:14,
                        // color: this.state.collection.environment.occAttr_3_1528533==110 ? greenFlash : 'grey',
                      }}>
                      Plus de 5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash,
                      }}
                      // onPress = {() => this.storeEnvironment('occAttr_3_1528533',110)}
                      ><Text style={{fontSize:14,
                        // color: this.state.collection.environment.occAttr_3_1528533==110 ? greenFlash : 'grey',
                      }}>
                      Ne sais pas</Text>
                    </TouchableOpacity>
                  </View>
                </View>
     
                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  Insecte photographié ailleurs que sur la fleur de votre station florale</Text>

                  <View style={{
                    flexDirection:'row',
                    alignItems:'space-between',
                    justifyContent:'center',
                     // alignItems: 'flex-start',
                  }}>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                        borderColor:greenFlash 
                      }}
                      // onPress = {() => this.storeEnvironment('occAttr_3_1528533',108)}
                      ><Text style={{fontSize:14,backgroundColor:'white',
                        // color: this.state.collection.environment.occAttr_3_1528533==108 ? greenFlash : 'grey',
                      }}>
                      Oui</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash
                      }}
                      // onPress = {() => this.storeEnvironment('occAttr_3_1528533',109)}
                      ><Text style={{fontSize:14,
                        // color: this.state.collection.environment.occAttr_3_1528533==109 ? greenFlash : 'grey',
                      }}>
                      Non</Text>
                    </TouchableOpacity>
                  </View>
                </View>


              </View>

              <ModalFilterPicker
                visible={this.state.visibleTaxonModal}
                title='Insecte'
                titleTextStyle={styles.titleTextStyle}
                options={insectList}
                onSelect={(picked) => this.storeInsect('taxon',picked)}
                onCancel={this.hideTaxonModal}
              />
        <FooterImage/>
        </ScrollView>
    )
  }
}


//-----------------------------------------------------------------------------------------
class SessionForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx);

    this.state = {
      remainingTime:false,
      isDateTimeVisible:false,
      isTimePickerVisible:false,
      isDatePickerVisible:false,
      session:{...props.data,
        date: props.data.date ? new Date(props.data.date) : false,
        time_start: props.data.time_start ? new Date(props.data.time_start) : false,
        time_end: props.data.time_end ? new Date(props.data.time_end) : false,
      },
      // session:{
      //   date:'', //yyyy-mm-dd //id:cc-3-session-date-1 , cc-3-session-date-2   
      //   time_start:'',    // hh:mm //smpAttr:22
      //   time_end:'',      // hh:mm //smpAttr:23
      //   smpAttr_24:'',    // couverture nuageuse
      //   smpAttr_25:'',    // températuere
      //   smpAttr_26:'',          // vent
      //   shadow:'',
      // },

    };
  }


  sessionStatus(){
    let status = false;
    if(this.isSessionOver()){
      status = 'over';
    }
    else if(this.isSessionRunning()){
      status = 'running';
    }
    else if(this.isSessionScheduled()){
      status = 'scheduled';
    }
    else {
      status = 'unset';
    }

    // console.log('SESSION status', status);
    // console.log('  now:' + new Date());
    // console.log('  deb:' + new Date( this.state.session.time_start))
    // console.log('  fin:' + new Date( this.state.session.time_end))

    return status;
  }

  isSessionRunning(){
    if(this.state.session.date && this.state.session.time_start){
      const now = new Date();
      // now.setMilliseconds(0);
      // now.setSeconds(0);

      isSessionRunning = 
      !this.state.session.time_end 
      ? now.getTime() >= this.state.session.time_start
      : now.getTime() >= this.state.session.time_start 
        && now.getTime() < this.state.session.time_end
      ;

      // console.log('isSessionRunning',isSessionRunning);
      return isSessionRunning;
    }
    return false;
  }

  isSessionOver(){
    // console.log('isSessionOver');
    if(this.state.session.date && this.state.session.time_end){
      const now = new Date();
      // now.setMilliseconds(0);
      // now.setSeconds(0);

      // const end = new Date(this.state.session.time_end);
      // end.setSeconds(0);
      // end.setMilliseconds(0);

      isSessionOver = now.getTime() >= this.state.session.time_end;

      return isSessionOver;
    }
    return false;
  }

  isSessionScheduled(){
    // console.log('isSessionScheduled');

    if (this.state.session.date && this.state.session.time_start
    && (this.props.protocole=='flash' || this.state.session.time_end)){

      const now = new Date();
    //     now.setMilliseconds(0);
    // now.setSeconds(0);

            isSessionScheduled = now.getTime() < this.state.session.time_start;

      // console.log(isSessionScheduled)
      return isSessionScheduled;
    }
    return false;
  }

  _showDateTime(value) { 
    // let now = new Date();
    // now = now.getFullYear() +'-'+ now.getMonth() +'-'+ now.getDate();
    this.setState({ 
      isDateTimeVisible: value,
      // should store session
      // session:{
      //   ...this.state.session, 
      //   date: !this.state.session.date ? now : this.state.session.date,
      // }
    }) 
  };

  _showTimePicker = (field) => {
    if(!this.state.session.date){
      this._showDatePicker();
    }
    else{
      if (field == 'start') {
        const start = new Date();
        this.initialTimeStart =  new Date(start.getTime() + 60000);
      }
      else {
        this.initialTimeEnd = new Date( this.initialTimeStart + ((flashSessionDuration+1)*1000));
      }
      this.setState({ isTimePickerVisible: field });
    }
  };

  _showDatePicker = () => { 
    this.initialDate = new Date();
    this.setState({ isDatePickerVisible: true })
  };

  _hideDateTimePicker = () => this.setState({ isTimePickerVisible: false, isDatePickerVisible:false });

  _handleDatePicked(date){
    date = date.getTime();

    let now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    now = now.getTime();

    let day3 = new Date();
    day3.setHours(0);
    day3.setMinutes(0);
    day3.setSeconds(0);
    day3.setMilliseconds(0);
    day3 = day3.getTime();
    day3 += 24*3 *60*60 * 1000;

    if(date >= now && date < day3){
      this.storeSession('date', date);
    }
    else{
      Alert.alert('Date passée', 'Lancez la session ou programmez la session dans les 3 jours à venir.'
      );
      this.setState({session:{...this.state.session,date:''}});
    }
    this._hideDateTimePicker();
  };

  _handleTimePicked = (time) => {
    now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    session_date = new Date(this.state.session.date);
    time = new Date(
      session_date.getFullYear(),
      session_date.getMonth(),
      session_date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0,
    );
    time = time.getTime();

    // Check time validity.
    if(time > now){
    
      if((this.state.isTimePickerVisible=='end'  
          && (!this.state.session.time_start || time > flashSessionDuration*1000 + this.state.session.time_start))
      || (this.state.isTimePickerVisible=='start' 
          && (!this.state.session.time_end   || time+flashSessionDuration*1000 < this.state.session.time_end))
      ){
        this.storeSession('time_'+this.state.isTimePickerVisible, time);
      }
      else {
        Alert.alert("la session doit durer plus de 20 minutes.");
        this.setState({
          session:{...this.state.session, ['time_'+this.state.isTimePickerVisible] : ''},
          isTimePickerVisible:false,
        });;
      }  
    }
    else{
      Alert.alert('Heure passée.');
      this.setState({
        session:{...this.state.session, ['time_'+this.state.isTimePickerVisible] : ''},
        isTimePickerVisible:false,
      });
    }
  };

  launchSession(){
    // if(!this.state.session.date){
      let now = new Date();
      now.setMilliseconds(0);
      now = now.getTime();

      let end = this.state.session.time_end; 
      if(this.props.protocole=='flash'){
        end = now + flashSessionDuration * 1000;
      }


      this.setState({
        session:{
          ...this.state.session,
          date:now,
          time_start:now,
          time_end:end,
        }
      }, function(){
        // TODO: check if really needed
        this.props.valueChanged('date', now);
        this.props.valueChanged('time_start', now);
        this.props.valueChanged('time_end', end);
      });
    // }
  }

  cancelSession(){
      // TODO: warn only if insect has been shot.
    Alert.alert(
      'Annuler la session ?',
      "Si vous annulez la session, toutes les photos associées seront définitivement perdues.",
      [
        {
          text: 'Poursuivre la session',
          onPress: () => {}
        },
        {
          text: 'Annuler la session', 
          onPress: () => {
            this.reallyCancelSession();
          }
        },
      ],
    );
  }

  reallyCancelSession(){
    this.setState({
      isDateTimeVisible:false,
      session:{
      ...this.state.session,
        date:'',
        time_start:'',
        time_end:'',
      }
    })
    this.props.valueChanged('date', '');
    this.props.valueChanged('time_start', '');
    this.props.valueChanged('time_end', '');

    // TODO: Delete insect attach to taht session & photos.
    
  }

  stopSession(){
    const now = new Date();

    if(now.getTime() < this.state.session.time_start + (flashSessionDuration+60)*1000){
      // TODO: warn only if insect has been shot.
      Alert.alert(
        'Annuler la session ?',
        "La session doit durer plus de 20 minutes. \n"
         + "Si vous l'annulez, toutes les photos associées seront définitivement perdues.",
        [
          {
            text: 'Poursuivre la session',
            onPress: () => {

            }
          },
          {
            text: 'Annuler la session', 
            onPress: () => {
              this.reallyCancelSession();
            }
          },
        ],
      );
    }
    else {
      this.closeSession(now);
    }
  }

  closeSession(date){
    date.setSeconds(0); // .setSeconds(now.getSeconds()-1);
    date.setMilliseconds(0);

    this.refs['running-timer'].clear();
    this.setState({
      isDateTimeVisible:false,
      session:{
      ...this.state.session,
        time_end: date.getTime(),
      }
    })
    this.props.valueChanged('time_end', date.getTime());
  }

  storeSession(field, value){
    this.setState({
      isTimePickerVisible:false,
      session:{
        ...this.state.session,
        [field]:value,
      }
    },function(){
      this.props.valueChanged(field, value);
       // TODO: AsyncStorage.setItem(this.props.data.date+'_collection', JSON.stringify( this.state.collection ));
    });
  }

  renderLaunchButton(){
    const sessionStatus = this.sessionStatus();
    return(
            sessionStatus == 'scheduled'
            ?
              <View style={[styles.collection_grp, {height:50, margin:0, borderTopWidth:1, borderTopColor:'white'}]}>

                  <View style={{flexDirection:'row'}}>
                    <View
                      style={{backgroundColor:greenFlash, padding:0, flexDirection:'row', justifyContent:'center', textAlign:'center',
                        borderRightWidth:1, borderRightColor:'white',
                        flex:1,
                      }}
                      >
                      <MaterialCommunityIcons
                        name="alarm" 
                        style={{color:'white', padding:10, backgroundColor:'transparent'}}
                        size={25}
                        backgroundColor = 'transparent'
                      />

                      <Timer
                        key="scheduling-timer"
                        ref="scheduling-timer"
                        style={{textAlign:'center', padding:10, fontWeight:'bold', fontSize:16, color:'white'}}
                        onTimeout={() => this.launchSession()}
                        time={this.state.session.time_start}
                      />

                    </View>

                    <TouchableOpacity
                      style={{padding:0, flexDirection:'row', justifyContent:'center', textAlign:'center',
                        backgroundColor: greenFlash,
                      }}
                      onPress = {() => this.reallyCancelSession()}
                      >
                      <MaterialCommunityIcons
                        name="close-circle" 
                        style={{padding:10, backgroundColor:'transparent',
                          color:'white',  }}
                        size={25}
                        backgroundColor = 'transparent'
                      />
                    </TouchableOpacity>
                  </View>

              </View>

            : sessionStatus == 'running' ?

              <View style={[styles.collection_grp, {height:50, margin:0, borderTopWidth:1, borderTopColor:'white'}]}>

                  <View style={{flexDirection:'row', flex:1}}>
                    <View
                      style={{backgroundColor:greenFlash, padding:0, flexDirection:'row', justifyContent:'center', textAlign:'center',
                        borderRightWidth:1, borderRightColor:'white',
                        flex:1,
                      }}
                      >
                      <MaterialCommunityIcons
                        name="play-circle-outline" 
                        style={{color:'white', padding:10, backgroundColor:'transparent'}}
                        size={25}
                        backgroundColor = 'transparent'
                      />
                      <Timer
                        key="running-timer"
                        ref="running-timer"
                        style={{textAlign:'center', padding:10, fontWeight:'bold', fontSize:16, color:'white'}}
                        onTimeout={()=>{alert('Session over TODO:setstate to refresh')}}
                        time={
                          this.state.session.time_end
                          ? this.state.session.time_end // has been set to start + 20min for flash protocole.
                          : this.state.session.time_start
                        }
                      />
                    </View>

                    <TouchableOpacity
                      style={{padding:0, flexDirection:'row', justifyContent:'center', textAlign:'center',
                        backgroundColor: greenFlash,
                      }}
                      onPress = {this.props.protocole=="flash"
                        ? () => this.cancelSession()
                        // : now.getTime() < this.state.session.time_start + (flashSessionDuration+60)*1000
                        //   ? () => this.cancelSession()
                          : () => this.stopSession()
                      }
                      >
                      <MaterialCommunityIcons
                        name={ 
                          this.props.protocole=="flash"
                          ? "close-circle" 
                          // : now.getTime() < this.state.session.time_start + (flashSessionDuration+60)*1000
                          //   ? "close-circle"
                            : "stop-circle"
                        }

                        style={{padding:10, backgroundColor:'transparent',
                          color: 'white',  }}
                        size={25}
                        backgroundColor = 'transparent'
                      />
                    </TouchableOpacity>
                  </View>

              </View>

            : sessionStatus == 'over' ?
           
              <View 
                style={{flexDirection:'row', flex:1, justifyContent:'center', marginTop:20,}}
                // onPress = {() => this.help('Protocole')} 
                >
                <Text style={{
                  fontSize:18, fontWeight:'bold',/* flex:1, textAlign:'center',*/ 
                  padding:5, color:greenFlash, backgroundColor:'transparent'}}>
                    {formatDate(this.state.session.date)}  {formatTime(this.state.session.time_start)}  -  {formatTime(this.state.session.time_end)}
                </Text>
       
              </View>

            : sessionStatus != 'unset' 
              ? null 
              : !this.state.isDateTimeVisible
                ?
                  <View style={{
                    flexDirection:'row',
                     
                    justifyContent:'center', alignItems:'center',
                    backgroundColor:greenFlash, 
                    }}>

                    <TouchableOpacity
                      style={{padding:0, flexDirection:'row', 
                        height:55,
                        justifyContent:'center', alignItems:'center',
                        borderRightWidth:1, borderRightColor:'white',
                        flex:1,
                      }}
                      onPress = {() => this.launchSession()}
                      >
                      <MaterialCommunityIcons
                        name="play-circle-outline" 
                        style={{color:'white', padding:10, backgroundColor:'transparent'}}
                        size={30}
                        backgroundColor = 'transparent'
                      />
                      <Text style={{textAlign:'center', padding:10, fontWeight:'bold', 
                        fontSize:18, color:'white'}}>
                      Lancer la session</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{padding:0, flexDirection:'row', justifyContent:'center', alignItems:'center',
                        backgroundColor:this.state.isDateTimeVisible ? 'white' :  greenFlash,
                        borderWidth: 1, borderColor: greenFlash,
                      }}
                      onPress = {() => this._showDateTime(!this.state.isDateTimeVisible)}
                      >
                      <MaterialCommunityIcons
                        name="alarm" 
                        style={{paddingLeft:15, paddingRight:15, backgroundColor:'transparent',
                          color:this.state.isDateTimeVisible ? greenFlash : 'white',  }}
                        size={30}
                        backgroundColor = 'transparent'
                      />
                    </TouchableOpacity>
                  </View>
                : 
                  <View>
                    <View style={{flexDirection:'row', flex:1}}>
                      <View
                        style={{backgroundColor:greenFlash, padding:0, flexDirection:'row', justifyContent:'center', textAlign:'center',
                          borderRightWidth:1, borderRightColor:'white',
                          flex:1,
                        }}
                        >
                        <Text style={{textAlign:'center', padding:10, fontWeight:'bold', fontSize:16, color:'white'}}>
                        Lancement planifié 
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={{padding:0, flexDirection:'row', justifyContent:'center', textAlign:'center',
                          backgroundColor:greenFlash
                        }}
                        onPress = {() => this._showDateTime(!this.state.isDateTimeVisible)}
                        >
                        <MaterialCommunityIcons
                          name="close-circle" 
                          style={{padding:10, backgroundColor:'transparent',
                            color:'white',  }}
                          size={25}
                          backgroundColor = 'transparent'
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.collection_subgrp,{marginTop:0,marginBottom:0, borderTopWidth:0}]}>
                      {/*
                      <Text style={styles.coll_subtitle}>
                      Date, Heure de début { this.props.protocole=='flash' ? '' : 'et de fin'}</Text>
                      */}
                      <View style={{
                        flexDirection:'row',
                        alignItems:'space-between',
                        justifyContent:'center',
                      }}>
                        <TouchableOpacity
                          style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                            borderColor:greenFlash, flex:0.6,
                          }}
                          onPress={this._showDatePicker}
                          >
                          <Text style={{fontSize:14,backgroundColor:'white', flex:1, textAlign:'center',
                            // color: this.state.collection.environment.occAttr_3_1528533==108 ? greenFlash : 'grey',
                            }}>
                            { this.state.session.date
                              ? formatDate(this.state.session.date)
                              : 'Date'
                            }
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                            borderColor:greenFlash, flex: 0.2,
                          }}
                          onPress = {() => this._showTimePicker('start')}
                          >
                          <Text style={{fontSize:14, flex:1, textAlign:'center',
                            // color: this.state.collection.environment.occAttr_3_1528533==109 ? greenFlash : 'grey',
                          }}>
                          { this.state.session.time_start
                            ? formatTime(this.state.session.time_start) 
                            : 'Début'
                          }
                          </Text>
                        </TouchableOpacity>

                        { this.props.protocole=='flash' ? null :
                        <TouchableOpacity
                          style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                            borderColor:greenFlash, flex:0.2,
                          }}
                          onPress = {() => this._showTimePicker('end')}
                          >
                          <Text style={{fontSize:14, flex:1, textAlign:'center',
                            // color: this.state.collection.environment.occAttr_3_1528533==110 ? greenFlash : 'grey',
                          }}>
                            { this.state.session.time_end
                              ? formatTime(this.state.session.time_end) 
                              : 'Fin'
                            }
                          </Text>
                        </TouchableOpacity>
                        }
                      </View>
                    </View>
      
                    <DateTimePicker
                      date = { this.initialDate }
                      isVisible={this.state.isDatePickerVisible}
                      onConfirm={(date) => this._handleDatePicked(date)}
                      onCancel={this._hideDateTimePicker}
                    />

                    <DateTimePicker
                      mode="time"
                      date = { this.state.isTimePickerVisible == 'start'
                        ? this.initialTimeStart : this.initialTimeEnd
                      }
                      isVisible={this.state.isTimePickerVisible!=false}
                      onConfirm={this._handleTimePicked}
                      onCancel={this._hideDateTimePicker}
                    />
                </View>
              
    );
  }

  render(){
    return(
      <View  style={{flex:1}}>
        <View  style={{flex:1}}>
        <ScrollView>
              <View style={styles.collection_grp}>
                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  Couverture nuageuse</Text>

                  <View style={{
                    flexDirection:'row',
                    alignItems:'space-between',
                    justifyContent:'center',
                     // alignItems: 'flex-start',
                  }}>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                        borderColor:greenFlash 
                      }}
                      onPress = {() => this.storeSession('smpAttr_24',123)}
                      ><Text style={{fontSize:14,backgroundColor:'white',
                        color: this.state.session.smpAttr_24==123 ? greenFlash : 'grey',
                      }}>
                      0-25%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash
                      }}
                      onPress = {() => this.storeSession('smpAttr_24',124)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_24==124 ? greenFlash : 'grey',
                      }}>
                      25-50%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash,
                      }}
                      onPress = {() => this.storeSession('smpAttr_24',125)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_24==125 ? greenFlash : 'grey',
                      }}>
                      50-75%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash,
                      }}
                      onPress = {() => this.storeSession('smpAttr_24',126)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_24==126 ? greenFlash : 'grey',
                      }}>
                      75-100%</Text>
                    </TouchableOpacity>
                  </View>
                </View>
     
                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  Température</Text>

                  <View style={{
                    flexDirection:'row',
                    alignItems:'space-between',
                    justifyContent:'center',
                     // alignItems: 'flex-start',
                  }}>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                        borderColor:greenFlash 
                      }}
                      onPress = {() => this.storeSession('smpAttr_25',127)}
                      ><Text style={{fontSize:14,backgroundColor:'white',
                        color: this.state.session.smpAttr_25==127 ? greenFlash : 'grey',
                      }}>
                      {'< 10ºC'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash
                      }}
                      onPress = {() => this.storeSession('smpAttr_25',128)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_25==128 ? greenFlash : 'grey',
                      }}>
                      10-20ºC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash,
                      }}
                      onPress = {() => this.storeSession('smpAttr_25',129)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_25==129 ? greenFlash : 'grey',
                      }}>
                      20-30ºC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash,
                      }}
                      onPress = {() => this.storeSession('smpAttr_25',130)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_25==130 ? greenFlash : 'grey',
                      }}>
                      {'> 30ºC'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>


                <View style={styles.collection_subgrp}>

                  <View style={{
                    flexDirection:'row',
                    alignItems:'space-between',
                    justifyContent:'center',
                     // alignItems: 'flex-start',
                  }}>
                  
                    <Text style={styles.coll_subtitle}>
                    Vent</Text>

                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                        borderColor:greenFlash 
                      }}
                      onPress = {() => this.storeSession('smpAttr_26',131)}
                      ><Text style={{fontSize:14,backgroundColor:'white',
                        color: this.state.session.smpAttr_26==131 ? greenFlash : 'grey',
                      }}>
                      Nul</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{
                    flexDirection:'row',
                    alignItems:'space-between',
                    justifyContent:'center',
                     // alignItems: 'flex-start',
                  }}>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash
                      }}
                      onPress = {() => this.storeSession('smpAttr_26',132)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_26==132 ? greenFlash : 'grey',
                      }}>
                      Faible, irrégulier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash,
                      }}
                      onPress = {() => this.storeSession('smpAttr_26',133)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_26==133 ? greenFlash : 'grey',
                      }}>
                      Faible, continu</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{
                    flexDirection:'row',
                    alignItems:'space-between',
                    justifyContent:'center',
                     // alignItems: 'flex-start',
                  }}>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash
                      }}
                      onPress = {() => this.storeSession('smpAttr_26',134)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_26==134 ? greenFlash : 'grey',
                      }}>
                      Fort, irrégulier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash,
                      }}
                      onPress = {() => this.storeSession('smpAttr_26',135)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_26==135 ? greenFlash : 'grey',
                      }}>
                      Fort, continu</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  Fleur à l'ombre</Text>

                  <View style={{
                    flexDirection:'row',
                    alignItems:'space-between',
                    justifyContent:'center',
                     // alignItems: 'flex-start',
                  }}>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                        borderColor:greenFlash 
                      }}
                      onPress = {() => this.storeSession('smpAttr_27',1)} 
                      ><Text style={{fontSize:14,backgroundColor:'white',
                        color: this.state.session.smpAttr_27==1 ? greenFlash : 'grey',
                      }}>
                      Oui</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                        borderColor:greenFlash
                      }}
                      onPress = {() => this.storeSession('smpAttr_27',0)}
                      ><Text style={{fontSize:14,
                        color: this.state.session.smpAttr_27==0 ? greenFlash : 'grey',
                      }}>
                      Non</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
        <FooterImage/>
        </ScrollView>
        </View>

        {this.renderLaunchButton()}

      </View>
    )
  }
}

//-----------------------------------------------------------------------------------------
class CollectionForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx)

    // TODO create  / sessions folders

    this.state = {
      gpsOpacity:new Animated.Value(1),
      connected:false,
      
      visibleTaxonModal:false,
      visiblePlaceModal:false,
      tab:'collection',
      editingSession:false,

      help:{
        visible:false,
        'protocole':{
          title:'Protocole',
          content:' «Flash» Vous disposez de 20 minutes exactement pour photographier toutes les espèces se nourrissant de votre plante. L’insecte doit être posé sur la fleur. Notez l’heure à laquelle vous commencez l’observation.',
        },
      },

      collection:{

        name: this.props.data.name,             // location:name   WTF !!
        protocole: this.props.data.protocole,
          // flash  name=smpAttr:21:464433 id=smpAttr:21:0  value=106
          // long        smpAttr:21:464433    smpAttr:21:1        107
        
        place:{
          long: this.props.data.place.long,     //  name=place:long  id=imp-sref-long
          lat: this.props.data.place.lat,       //  name=place:lat  imp-sref-lat
          name: this.props.data.place.name,     //
        },
        
        flower:{
          photo:'',
          id_flower_unknown:false,
          taxon_list_id_list:false,     // flower:taxa_taxon_list_id_list[]
          taxon_name:'',                // just for display on app.
          taxon_extra_info:'',
          comment:'',
        },

        environment:{
          photo:'',
          occAttr_3_1528533:false,      //  spontanée, plantée occAttr:3:1528533
          locAttr_2:'',                 //  ruche
          locAttr_1:[],                 //  habitat
          locAttr_3:false,                 //  grande culture en fleur
        },
      },
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
    };

    this.gpsSearching = false;
    this.toValue = 1;
  }

  componentDidMount(){
    NetInfo.addEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );
    NetInfo.isConnected.fetch().done(
        (isConnected) => { 
          this.setState({'connected':isConnected}); }
    );
  
    // Load data.
    AsyncStorage.getItem(this.props.data.date+'_collection', (err, collection) => {
      if (err) {
        Alert.alert('ERROR getting collection ' + this.props.data.date+'_collection ... ' + JSON.stringify(err));
      }
      else {
        console.log('localStorage '+ this.props.data.date+'_collection', JSON.parse(collection));
        if(collection){
          console.log(this.props.data.date+'_collection', JSON.parse(collection));
          this.setState({collection:JSON.parse(collection)});
        }
      }
    });

    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.back();
      return true;
    });
  
    if(!this.state.collection.name){
      this.refs['name'].focus();
    }
  }

  componentWillUnmount(){
    this.backHandler.remove();
    BackHandler.removeEventListener('hardwareBackPress', this.backButton);
    NetInfo.removeEventListener(
        'connectionChange',
        this._handleConnectivityChange
    );
    navigator.geolocation.clearWatch(this.watchID);
  }

  _handleConnectivityChange = (isConnected) => {
    console.log(isConnected);
    this.setState({'connected':isConnected});
  }

/*
  upd_protocole(type){
    this.setState({collection:{
      ...this.state.collection,
      protocole:type,
    }}, function(){
      console.log(this.state.collection);
    });
  }
*/

  storeCollection(){
    AsyncStorage.setItem(this.props.data.date+'_collection', JSON.stringify( this.state.collection ));
  }

  storeFlower(field, value){
    const flower = field=='id_flower_unknown' && value
    ? {
        id_flower_unknown:value,
        taxon_list_id_list:false,
        taxon_name:'',
        taxon_extra_info:'',
      }
    : {
        ...this.state.collection.flower,
        [field]:value,
      }
    ;

    this.setState({
      collection:{
        ...this.state.collection,
        flower:flower,
      }}, function(){
        this.storeCollection();
      }
    );
  }
 
  storeEnvironment(field, value){
    if(field=='locAttr_1') {
      // Multiselect.
      array = this.state.collection.environment.locAttr_1;
      var index = array.indexOf(value);
      if (index !== -1) {
        array.splice(index, 1);
      }
      else{
        array.push(value);
      }
      value = array;
    }

    this.setState({
      collection:{
        ...this.state.collection,
        environment:{
          ...this.state.collection.environment,
          [field]:value,
        },
      },
    }, function(){
      this.storeCollection();
    })
  
  }

  selectTaxon = (picked) => {
    console.log(picked);
    this.setState({
      collection:{
        ...this.state.collection,
        flower:{
          ...this.state.collection.flower,
          taxon_list_id_list:picked.value,
          taxon_name:picked.label,
        },
      },
      visibleTaxonModal: false,
    }, function(){
      this.storeCollection();
    })
  }

  showTaxonModal = () => {
    this.setState({visibleTaxonModal:true});
  }
  hideTaxonModal = () => {
    this.setState({visibleTaxonModal: false});
  }

  geoLoc = async () => {
    if (this.gpsSearching) return;

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]);

    // console.log('geoloc permission requested');
    
    if (granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
    &&  granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED){

      // console.log('geoloc permission granted');

      this.gpsSearching = true;
      this.gpsAnimation();
      // this.setState({collection:{
      //   ...this.state.collection,
      //   place:{
      //     lat:'',
      //     long:'', 
      //   },
      // }});
      this.setState({
        place:{
          lat:'',
          long:'', 
        },
      });

      this.watchID = navigator.geolocation.watchPosition(
        (position) => {
          console.log(position);
          navigator.geolocation.clearWatch(this.watchID);
          this.gpsSearching = false;

          // Get place name
          NativeModules.ioPan.getLocationName(position.coords.latitude, position.coords.longitude)
          .then((ville) => {
            this.storeListItem('place', { 
              ...this.state.collection.place,
              lat:position.coords.latitude,
              long:position.coords.longitude, 
              name: ville,
            });
          })          
          .catch((error) => { 
            this.storeListItem('place', { 
              ...this.state.collection.place,
              lat:position.coords.latitude,
              long:position.coords.longitude, 
              name: 'Nom introuvable',
            });
          }); 

        },
        (error) => {
          this.gpsSearching = false;
          Alert.alert('Position introuvable.');
          // console.log('GPS error: ', JSON.stringify(error))
        },{
          enableHighAccuracy:true,
          timeout:500, 
          maximumAge:1000,
        }
      );
    }
  }


  gpsAnimation() {
    if (!this.gpsSearching && this.toValue==1){
      return;
    }

    this.toValue = (this.toValue==0) ?1:0;
    Animated.timing(
      this.state.gpsOpacity,
      {
        toValue: this.toValue,
        useNativeDriver: true,
      }
    ).start(() => this.gpsAnimation())  
  }

  storeListItem(key, value){
    if(value){
      this.setState({collection:{...this.state.collection, 
          [key]:value,
        }}, function(){
          this.props.valueChanged(key,value);
          this.storeCollection();
        }
      );
    }
    else{
      this.setState({collection:{...this.state.collection, 
          [key]:this.tempValue,
      }});
    }
  }

  edit(field){
    this.tempValue = this.state.collection[field];

      this.setState({collection:{...this.state.collection, 
          [field]:'',
        }}, function(){
      this.refs[field].focus();
    });
  }

  showPlaceModal(){
    this.setState({visiblePlaceModal:true});
  }

  hidePlaceModal(placeData){
    this.storeListItem('place', placeData);
    this.setState({visiblePlaceModal:false});
  }

  back(){
    this.props.valueChanged('editing',false);
  }

  help(topic){
    this.setState({
      help:{
        ...this.state.help,
        visible:true,
       // title:topic,
      }
    })
  }

  hideHelpModal(){
    this.setState({
      help:{
        ...this.state.help,
        visible:false,
      }
    })
  }

  setTab(value){
    this.setState({tab:value});
  }


  renderCollMenu(){
    /*

            */
    return(
      <View style={{margin:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
        {/*<ScrollView horizontal={true}>*/}
         
           <TouchableOpacity 
            style={{ marginLeft:5, marginRight:5,
              flexDirection:'row', justifyContent:'center', alignItems:'center', 
              // borderRightWidth:1, borderRightColor:'lightgrey',
              }}
            onPress = {() => this.setTab('collection')} 
            >
            <MaterialCommunityIcons
              name="flower"  // search-web  magnify  map-search
              style={{
                backgroundColor:'transparent',
                margin:5,
                color:greenFlash,
              }}
              size={25}
            />
            <Text style={{ fontSize:16,
              color: this.state.tab=='collection'? greenFlash :'grey'}}>
            Fleur</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginLeft:5, marginRight:5,
              flexDirection:'row', justifyContent:'center', alignItems:'center', 
              // borderRightWidth:1, borderRightColor:'lightgrey',
              }}
            onPress = {() => this.setTab('sessions')} 
            >
            <MaterialCommunityIcons
              name="calendar-clock"  // search-web  magnify  map-search
              style={{
                backgroundColor:'transparent',
                margin:5,
                color:greenFlash,
              }}
              size={25}
            />
            <Text style={{ fontSize:16,
              color: this.state.tab=='sessions'? greenFlash :'grey'}}>
            Session{this.state.collection.protocole=='flash'?'':'s'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginLeft:5, marginRight:5,
              flexDirection:'row', justifyContent:'center', alignItems:'center', 
              // borderBottomWidth:1, borderBottomColor:'grey',
              }}
            onPress = {() => this.setTab('insectes')} 
            >
            <MaterialCommunityIcons
              name="ladybug"  // search-web  magnify  map-search
              style={{
                backgroundColor:'transparent',
                margin:5,
                color:greenFlash,
              }}
              size={25}
            />
            <Text style={{ fontSize:16, 
              color: this.state.tab=='insectes'? greenFlash :'grey'}}>
            Insectes</Text>
          </TouchableOpacity>
        {/*</ScrollView>*/}
      </View>
    );
  }

  render () {
    console.log('render CollectionForm state', this.state);
    return (
      <View style={{flex:1}}>

        { // Main topbar: collection name.
          this.state.collection.name
          ? <View style={{flexDirection:'row', height:50, borderBottomWidth:1, borderBottomColor:'white', }}>
              <TouchableOpacity 
                style={[{
                  padding:10,
                  borderRightWidth:1, borderRightColor:'white', 
                  backgroundColor:greenFlash,
                }]}
                onPress = {() => this.back()} 
                >
                <MaterialCommunityIcons
                  name="chevron-left" 
                  style={[{ color:'white',
                  }]}
                  size={30}
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={{flexDirection:'row', flex:1}}
                onPress = {() => this.edit('name')} 
                >
                <Text style={[styles.titleTextStyle,{flex:1}]}>{this.state.collection.name}</Text>
                <MaterialCommunityIcons
                  name="pencil" 
                  style={[{color:'white', paddingTop:10, width:50, backgroundColor:greenFlash} ]}
                  size={25}
                  backgroundColor = 'transparent'
                />
              </TouchableOpacity>
            </View>

          : <TextInput
              ref="name"
              style={styles.collection_input_text}
              placeholder='Nom de la collection'
              onEndEditing = {(event) => this.storeListItem('name', event.nativeEvent.text)} 
              onSubmitEditing = {(event) => this.storeListItem('name', event.nativeEvent.text)} 
            />
        }

        { // Menu: flower / session / insect
          this.state.collection.name && this.state.collection.protocole
          ? this.renderCollMenu()
          : null
        }

            
        { // Collection Form.
        this.state.tab=='collection' 
        ? <View style={{flex:1}}>
          
              { !this.state.collection.protocole 
              ? <View style={{flex:1}}>
                  <TouchableOpacity 
                    style={{flexDirection:'row', justifyContent:'center', marginTop:20,}}
                    onPress = {() => this.help('Protocole')} 
                    >
                    <Text style={{
                      fontSize:18, fontWeight:'bold',/* flex:1, textAlign:'center',*/ 
                      padding:5, color:greenFlash, backgroundColor:'transparent'}}>
                    PROTOCOLE</Text>
                    <MaterialCommunityIcons
                      name="help-circle-outline" 
                      style={{color:greenFlash, paddingTop:10, backgroundColor:'transparent'}}
                      size={15}
                      backgroundColor = 'transparent'
                    />
                  </TouchableOpacity>
      
                  <View style={[styles.collection_grp, {flexDirection:'row'}]}>      
                    <TouchableOpacity 
                      style={{ marginRight:5, padding:2,
                        flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center',
                        borderWidth:1, borderColor:this.state.collection.protocole=='flash'?greenFlash:'grey',
                      }}
                      onPress = {() => this.storeListItem('protocole','flash')} 
                      >
                      <MaterialCommunityIcons
                        name="flash" 
                        style={{
                          backgroundColor:'transparent',
                          color:this.state.collection.protocole=='flash'?greenFlash:'grey',
                        }}
                        size={25}
                      />
                      <Text style={{fontSize:16,
                        color:this.state.collection.protocole=='flash'?greenFlash:'grey'
                        }}>
                      Flash</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ marginLeft:5, padding:2,
                        flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center',
                        borderWidth:1, borderColor:this.state.collection.protocole=='long'?greenFlash:'grey',
                        }}
                      onPress = {() => this.storeListItem('protocole','long')} 
                      >
                      <MaterialCommunityIcons
                        name="timer-sand" 
                        style={{
                          backgroundColor:'transparent',
                          color:this.state.collection.protocole=='long'?greenFlash:'grey',
                        }}
                        size={25}
                      />
                      <Text style={{ fontSize:16,
                        color:this.state.collection.protocole=='long'?greenFlash:'grey',
                        }}>
                      Long</Text>
                    </TouchableOpacity>

                  </View>
                  <View style={{flex:1}}></View>
                  <FooterImage/>
                </View>
              : 
                <ScrollView style={{flex:1}}>
                  {/*
                  <View style={styles.collSectionTitle}>
                    <Text style={styles.collSectionTitleText}>
                    Station Florale</Text>
                  </View>

                  */}
                  <View style={{flexDirection:'row',
                                 marginTop:20,
                              // flexDirection:'row',
                              justifyContent: 'flex-start',
                              alignItems: 'center',
                              margin:15,
                    }}>
                    <ImagePicker 
                      ref="collection-flower"
                      style={{marginRight:5, flex:0.5,
                        borderWidth:1, borderColor:'lightgrey', backgroundColor:'white',
                      }}
                      title={'Fleur en\ngros plan'}
                      onPress = {() => this.props.pickPhoto('flower')}
                      crop={{w:150,h:150}}
                      size={{w:150,h:150}}
                      source={{uri:'file://' + this.props.filePath + '/collections/' + this.props.data.date + '/flower.jpg'}}
                    />


                    <ImagePicker 
                      // TODO ? multiple photos before user choose at the end ?
                      title={'Fleur à 2-3 mètres\nde distance'}
                      ref="collection-environment"
                      style={{marginLeft:5, flex:0.5, backgroundColor:'white',
                        borderWidth:1, borderColor:'lightgrey',
                      }}
                      onPress = {() => this.props.pickPhoto('environment')}
                      crop={{w:150,h:150}}
                      size={{w:150,h:150}}
                      source={{uri:'file://' + this.props.filePath + '/collections/' + this.props.data.date + '/environment.jpg'}}
                    />
                  </View>

                  <View style={styles.collection_grp}>

                    {/* TODO ... one day maybe               
                    <CheckBox
                                        textStyle={styles.collection_input_text}
                      checkedColor = {greenFlash}
                      uncheckedColor = {greenDark}
                      title={'Faire confiance en l\'IA'}
                      checkedIcon='dot-circle-o'
                      uncheckedIcon='circle-o's
                      checked={this.state.collection.protocole != 'Flash'}
                      onPress = {() => this.upd_protocole('Long')}
                    />
                    */}
                  
                    <TouchableOpacity 
                      style={{ marginBottom:10,
                        flexDirection:'row', flex:1, 
                        alignItems:'center',
                        backgroundColor:'white', borderColor:'lightgrey', borderWidth:1}} 
                      onPress={()=>this.storeFlower('id_flower_unknown', !this.state.collection.flower.id_flower_unknown)}
                      >
                      <MaterialCommunityIcons
                        name= {this.state.collection.flower.id_flower_unknown ? "checkbox-marked" : "checkbox-blank-outline"}
                        style={{ 
                          color: greenFlash, padding:5,
                          backgroundColor:'transparent',
                        }}
                        size={25}
                      />
                      <Text style={{padding:5, fontSize:14, 
                        color:'grey', backgroundColor:'white',}}>
                      Je ne connais pas le nom de cette fleur</Text>
                    </TouchableOpacity> 

                    { this.state.collection.flower.id_flower_unknown
                      ? null
                      : <React.Fragment>
                          <TouchableOpacity 
                            style={{
                              overflow:'hidden', marginBottom:10,
                              flexDirection:'row', flex:1, alignItems:'center',
                              backgroundColor:'white', borderColor:'lightgrey', borderWidth:1}} 
                            onPress={this.showTaxonModal}
                            >
                              <MaterialCommunityIcons
                                name="chevron-down" 
                                style={{ color:'white', padding:5, marginRight:5,
                                backgroundColor:greenFlash,
                                }}
                                size={22}
                              />
                            <View style={{overflow:'hidden',flex:1}}>
                            <Text style={{padding:5,
                              fontSize:14,
                              backgroundColor:'white',
                              color:this.state.collection.flower.taxon_list_id_list?greenFlash:'grey'
                              }}>
                              { this.state.collection.flower.taxon_list_id_list
                                ? this.state.collection.flower.taxon_name
                                : 'Je choisis dans la liste'
                              }
                            </Text>
                            </View>
                          </TouchableOpacity>      

                          <TextInput
                            placeholder='Je connais une dénomination plus précise'
                            placeholderTextColor='grey'
                            style={{ flex:1, padding:5, marginBottom:5,borderWidth:1, 
                              fontSize:14,
                              backgroundColor:'white',
                              color:greenFlash,
                              borderColor:this.state.collection.flower.taxon_extra_info?greenFlash:'lightgrey', }} 
                            defaultValue ={this.state.collection.flower.taxon_extra_info}
                            onEndEditing = {(event) => this.storeFlower('taxon_extra_info',event.nativeEvent.text) } 
                            onSubmitEditing = {(event) => this.storeFlower('taxon_extra_info', event.nativeEvent.text) }                        
                          />
                        </React.Fragment>
                    }

                    <TextInput
                      placeholder='Commentaire'
                      // multiline={true}
                      // numberOfLines={3} 
                      placeholderTextColor='grey'        
                      style={{fontSize:14, color:'grey',
                        padding:5, marginTop:15, borderColor:'lightgrey', borderWidth:1,}}
                      defaultValue ={this.state.collection.flower.comment}
                      onEndEditing = {(event) => this.storeFlower('comment',event.nativeEvent.text) } 
                      onSubmitEditing = {(event) => this.storeFlower('comment', event.nativeEvent.text) }  
                    />
                  </View>


                  <View style={styles.collSectionTitle}>
                    <Text style={styles.collSectionTitleText}>
                    Lieu</Text>
                  </View>

                  <View style={styles.collection_grp}>
                    { this.state.collection.place.lat && this.state.collection.place.long
                      ?
                      <React.Fragment>
                      <View style={{flexDirection:'row', flex:1, justifyContent: 'center'}}>
                        <Text style={{fontSize:16,
                          color:'grey'
                          }}
                          >{this.state.collection.place.name}
                        </Text>
                      </View>
                      <View style={{flexDirection:'row', flex:1, justifyContent: 'center'}}>
                        <Text style={{fontSize:16,
                          color:'grey'
                          }}
                          >
                          { 
                            dmsFormat(deg2dms(this.state.collection.place.lat, 'lat')) 
                            + '   ' + 
                            dmsFormat(deg2dms(this.state.collection.place.long, 'lon'))
                          }
                        </Text>
                      </View>
                      </React.Fragment>
                      : null
                    }
                  </View>

                  <View style={[styles.collection_grp, {flexDirection:'row', flex:1, paddingTop:0}]}>           
                    <TouchableOpacity 
                      style={{ marginRight:5, 
                        flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center', borderWidth:1,
                        borderColor:this.state.protocole=='flash'?greenFlash:'grey',
                      }}
                      onPress ={ () => this.geoLoc() }
                      >
                      <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding:0,
                        }}
                        >
                        <Animated.View style={[{position:'absolute'}, { opacity: this.state.gpsOpacity }]}>
                          <MaterialCommunityIcons
                            name="crosshairs-gps" 
                            size={20}
                            height={40}
                            width={60}
                            margin={0}
                            color={greenFlash}
                            backgroundColor = 'transparent'
                          />
                        </Animated.View>
                        <MaterialCommunityIcons
                          name="crosshairs"
                          size={0}
                          height={40}
                          width={60}
                          margin={0}
                          color={greenFlash}
                          backgroundColor = 'transparent'
                          
                        />
                      </View>
                      <Text style={{fontSize:16, marginLeft:15,
                        color: this.gpsSearching  ? greenFlash:'grey'
                        }}>
                      Localiser</Text>

                    </TouchableOpacity>

                    { this.state.connected && this.state.connected.type != 'none'
                      ? <TouchableOpacity 
                          style={{ marginLeft:5,
                            flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center', borderWidth:1,
                            borderColor:'grey',
                            }}
                          onPress = {() => this.showPlaceModal()} 
                          >
                          <MaterialCommunityIcons
                            name="magnify"  // search-web  magnify  map-search
                            style={{
                              backgroundColor:'transparent',
                              color:greenFlash,
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


                  <View style={styles.collSectionTitle}>
                    <Text style={styles.collSectionTitleText}>
                    Environnement de la fleur</Text>
                  </View>

                  <View style={styles.collection_grp}>
                  <View style={styles.collection_subgrp}>
                    <Text style={styles.coll_subtitle}>
                    La plante est</Text>

                    <View style={{
                      flexDirection:'row',
                      alignItems:'space-between',
                      justifyContent:'center',
                       // alignItems: 'flex-start',
                    }}>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                          borderColor:greenFlash 
                        }}
                        onPress = {() => this.storeEnvironment('occAttr_3_1528533',108)}
                        ><Text style={{fontSize:14,backgroundColor:'white',
                          color: this.state.collection.environment.occAttr_3_1528533==108 ? greenFlash : 'grey',
                        }}>
                        Spontanée</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash
                        }}
                        onPress = {() => this.storeEnvironment('occAttr_3_1528533',109)}
                        ><Text style={{fontSize:14,
                          color: this.state.collection.environment.occAttr_3_1528533==109 ? greenFlash : 'grey',
                        }}>
                        Plantée</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash,
                        }}
                        onPress = {() => this.storeEnvironment('occAttr_3_1528533',110)}
                        ><Text style={{fontSize:14,
                          color: this.state.collection.environment.occAttr_3_1528533==110 ? greenFlash : 'grey',
                        }}>
                        Ne sais pas</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.collection_subgrp}>
                    <Text style={styles.coll_subtitle}>
                    Distance approximative de la plus proche ruche d'abeilles domestiques.</Text>
                    <Text style={styles.coll_subtitle}>
                    En mètres; par exemple : 150</Text>
                    <View style={{alignItems:'center', margin:0, padding:0}}>
                    <TextInput
                      keyboardType="number-pad"
                      style={{ margin:5,borderWidth:1, width:60, padding:0,
                        textAlign:'center',
                        fontSize:16,
                        backgroundColor:'white',
                        color:greenFlash,
                        borderColor:greenFlash, }} 
                      defaultValue={''+this.state.collection.environment.locAttr_2}
                      onEndEditing = {(event) => this.storeEnvironment( 'locAttr_2', isNaN(parseInt(event.nativeEvent.text),10) ? '' : parseInt(event.nativeEvent.text),10)} 
                      onSubmitEditing = {(event) => this.storeEnvironment( 'locAttr_2', isNaN(parseInt(event.nativeEvent.text),10) ? '' : parseInt(event.nativeEvent.text),10)}               
                    /></View>
                  </View>

                  <View style={styles.collection_subgrp}>
                    <Text style={styles.coll_subtitle}>
                    Grande culture en fleur à moins de 50m</Text>
                    <View style={{
                      flexDirection:'row',
                      alignItems:'space-between',
                      justifyContent:'center',
                       // alignItems: 'flex-start',
                    }}>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                          borderColor:greenFlash 
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_3',140)}
                        ><Text style={{fontSize:14,
                          color: this.state.collection.environment.locAttr_3==140 ? greenFlash : 'grey',
                        }}>
                        Oui</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_3',141)}
                        ><Text style={{fontSize:14,
                          color: this.state.collection.environment.locAttr_3==141 ? greenFlash : 'grey',
                        }}>
                        Non</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash,
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_3',142)}
                        ><Text style={{fontSize:14,
                          color: this.state.collection.environment.locAttr_3==142 ? greenFlash : 'grey',
                        }}>
                        Ne sais pas</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.collection_subgrp}>
                    <Text style={styles.coll_subtitle}>
                    Type d'habitat</Text>

                    {/* multi select */}
                    <View style={{
                      flex:1,
                      flexWrap: 'wrap',
                      flexDirection:'row',
                      justifyContent:'center',
                      alignItems: 'flex-start',
                    }}>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                          borderColor:greenFlash ,
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',111)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(111)!==-1 ? greenFlash : 'grey',
                        }}>
                        urbain</Text>
                      </TouchableOpacity>
                      <TouchableOpacity                  
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',112)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(112)!==-1 ? greenFlash : 'grey',
                        }}>
                        péri-urbain</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash,
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',113)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(113)!==-1 ? greenFlash : 'grey',
                        }}>
                        rural</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                          borderColor:greenFlash 
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',114)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(114)!==-1 ? greenFlash : 'grey',
                        }}>
                        grande culture</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',115)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(115)!==-1 ? greenFlash : 'grey',
                        }}>
                        forêt</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash,
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',116)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(116)!==-1 ? greenFlash : 'grey',
                        }}>
                        prairie</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                          borderColor:greenFlash 
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',117)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(117)!==-1 ? greenFlash : 'grey',
                        }}>
                        littoral</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',118)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(118)!==-1 ? greenFlash : 'grey',
                        }}>
                        parc, jardin public</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash,
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',119)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(119)!==-1 ? greenFlash : 'grey',
                        }}>
                        jardin privé</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                          borderColor:greenFlash 
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',120)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(120)!==-1 ? greenFlash : 'grey',
                        }}>
                        rochers</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',121)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(121)!==-1 ? greenFlash : 'grey',
                        }}>
                        bord de route</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                          borderColor:greenFlash,
                        }}
                        onPress = {() => this.storeEnvironment('locAttr_1',122)}
                        ><Text style={{fontSize:14,
                          color:this.state.collection.environment.locAttr_1.indexOf(122)!==-1 ? greenFlash : 'grey',
                        }}>
                        bord de l'eau</Text>
                      </TouchableOpacity>

                    </View>
                  </View>
                </View>
                <FooterImage/>
              </ScrollView>
              }
              
              
              </View>
            
            : this.state.tab=='sessions'
            ?
              <View style={{flex:1}}>
                <SessionList
                  collection_id = {this.props.data.date}
                  protocole = {this.props.data.protocole}
                />
              </View>
         
            : this.state.tab=='insectes' 
            ?
              <View style={{flex:1}}>
                    <InsectForm
                      collection_id = {this.props.data.date}

                    />
                </View>
                
            : null
            }

          <ModalPlace
            visible = {this.state.visiblePlaceModal}
            title={this.state.collection.name}
            lat={this.state.collection.place.lat}
            lon={this.state.collection.place.long}
            name={this.state.collection.place.name}
            // locationChanged = {this._updateLocation}
            onCancel={(data) => this.hidePlaceModal(data)} 

            // closeMe = {this._closeModal}
            // connected = {this.state.connected}
          />
    
          <ModalFilterPicker
            visible={this.state.visibleTaxonModal}
            title='Fleur'
            titleTextStyle={styles.titleTextStyle}
            options={flowerList}
            onSelect={this.selectTaxon}
            onCancel={this.hideTaxonModal}
          />

          <ModalHelp
            visible={this.state.help.visible}
            titleTextStyle={styles.titleTextStyle}
            content={this.state.help.protocole}
            onCancel={() => this.hideHelpModal()} 
          />
      </View>
    );
  }
}



//=========================================================================================
export class SessionList extends Component {
//-----------------------------------------------------------------------------------------
 constructor(props) {
    super(props);

    this.state = {
      sessions:[],
      editing: false,
    };
  }

  componentDidMount(){
 
    console.log('session LIST MOUNT');
    AsyncStorage.getItem(this.props.collection_id+'_sessions', (err, sessions) => {
      if (err) {
        Alert.alert('ERROR getting sessions '+ JSON.stringify(err));
      }
      else {
        if(sessions){
          console.log('sessions',JSON.parse(sessions));
          this.setState({
            sessions: JSON.parse(sessions),
            editing: this.props.protocole == 'flash' ? 0 : false,
          });
        }
      }
    });

    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.back();
      return true;
    });
  
  }

  back(){
    if(this.state.editing!==false) {
      if(this.props.protocole=='flash'){
        // TODO: back to flower or collection list
      }
      else{
        this.setState({editing:false});     
      }
    }
    else {
      // TODO: back to collection list
      // alert();
    }
  }

  componentWillUnmount(){
    this.backHandler.remove();
    console.log('session LIST UN-MOUNT');
  }

  // setSource(collection, field, source){
  //   // this.setState({
  //   //   editing:collection,
  //   // }, function(){

  //   //   console.log(field,source)

  //     // this.refs['collection-form'].refs['collection-'+field].setSource(source);
  //   // });
  // }


  newSession(){
    
    const now = date2folderName();
    
    let sess = this.state.sessions;
    sess.push({
        date:'',
        time_start:'',
        time_end:'',
        smpAttr_24:'',
        smpAttr_25:'',
        smpAttr_26:'',
        shadow:'',
    });

    this.setState({ 
      sessions: sess,
      editing:sess.length-1,
    }, function(){
     
    });
  }

  selectSession(index){
    this.setState({editing:index});
  }

  sessionChanged(key, val){
    if(key=='editing'){
      this.setState({[key]:val});
    }
    else{
      let sess = this.state.sessions;
      sess[this.state.editing][key] = val;
      this.setState({sessions:sess}, function(){
        // TODO: check we don't do this twice (storeSession).
        AsyncStorage.setItem(this.props.collection_id + '_sessions', JSON.stringify( this.state.sessions ));   
      })
    }
  }

  renderDateTime(index, value){
    console.log()
    const date  = value.date ? new Date(value.date) : '',
          time_start = value.time_start ? new Date(value.time_start) : '',
          time_end = value.time_end ? new Date(value.time_end) : '';

    return (
      <View style={{padding:5, overflow:'hidden'}}>
        <View style={{flexDirection:'row', flex:1}}>
          {/*
          <MaterialCommunityIcons
            name={ value.protocole == 'flash' 
            ? 'flash-outline' 
            : value.protocole == 'long' 
              ? 'timer-sand'
              : 'help-circle-outline'
            }
            style={[styles.listItemText,{
                margin:0,
                marginTop:7,
              }]}
            size={18}
          />
          */}

          <Text style={[styles.listItemText, {fontWeight:'normal', fontSize:16}]}>
          {index}- {formatDate(date)}</Text>
        </View>
        <View> 
          <Text style={styles.listItemText}>
          { formatTime(time_start) } - { formatTime(time_end) }</Text>
        </View>
      </View>   
    );
  }

  render(){
    return(
       <View style={{flex:1}}>
        { this.state.editing === false
          ? <View style={{flex:1}}>

              { this.props.protocole == 'flash' ? null : // default session is created and flash has only one.
              <TouchableOpacity  
                style={[styles.listItem,styles.listItemNew, {height:50}]}
                onPress = {() => this.newSession()}
                >
                <MaterialCommunityIcons   
                  name='plus-circle-outline'
                  style={{fontSize:24, paddingRight:10, color:'white'}}
                />
                <Text style={{color: 'white', fontSize:16,}}>
                Créer une session</Text>
              </TouchableOpacity>
              }

              <ScrollView>
              { this.state.sessions.map((value, index) => 
                <TouchableOpacity  
                  key={index}
                  style={[styles.listItem,  this.state.sessions.length-1==index 
                    ? {borderBottomWidth:15}
                    : null
                  ]}
                  onPress = {() => this.selectSession(index)}
                  >
                  {/*  
                                  <Image
                                    style={{ 
                                      margin:1,
                                      width:80,
                                      height:80,
                                    }}
                                    resizeMode="contain"
                                    source={{uri:'file://' + this.props.filePath + '/collections/' + value.date +'/flower.jpg' + '?t='+ new Date().getTime() }}
                                  />
                                  <Image
                                    style={{ 
                                      margin:1,
                                      width:80,
                                      height:80,
                                    }}
                                    resizeMode="contain"
                                    source={{uri:'file://' + this.props.filePath + '/collections/' + value.date +'/environment.jpg' + '?t='+ new Date().getTime() }}
                                  />
                  */}
              

                  { this.renderDateTime(index, value) }

                  
                </TouchableOpacity>
              )}
              </ScrollView>           
            </View>

          : <React.Fragment>
              <SessionForm 
                ref="session-form"
                protocole={this.props.protocole}
                // collection_id = {this.props.data.date}

                data={this.state.sessions[this.state.editing]}
                valueChanged={(key,val) => this.sessionChanged(key,val)}

                // filePath={this.props.filePath}
                // pickPhoto = {(field) => this.props.pickPhoto('collection--'+this.state.collections[this.state.editing].date+'--'+field)}
              />
            </React.Fragment>

        }

      </View>
    );
  }

} // Session List



//=========================================================================================
export default class CollectionList extends Component {
//-----------------------------------------------------------------------------------------
 constructor(props) {
    super(props);

    this.state = {
      collections:[],
      editing:false,
      selectItems:false,
    };
  }

  componentDidMount(){
    console.log('LIST MOUNT');

    AsyncStorage.getItem('collections', (err, collections) => {
      if (err) {
        Alert.alert('ERROR getting collections '+ JSON.stringify(err));
      }
      else {
        if(collections){
          console.log(JSON.parse(collections));
          this.setState({collections:JSON.parse(collections)});
        }
      }
    });

    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.state.selectItems!==false){
        this.setState({selectItems:false});
      }
      return true;      
    });
  }

  componentWillUnmount(){
    this.backHandler.remove();
    BackHandler.removeEventListener('hardwareBackPress', this.backButton);
    console.log('LIST UN-MOUNT');
  }

  // setSource(collection, field, source){
  //   // this.setState({
  //   //   editing:collection,
  //   // }, function(){

  //   //   console.log(field,source)

  //     this.refs['collection-form'].refs['collection-'+field].setSource(source);
  //   // });
  // }

  newCollection(){
    const now = date2folderName();
    
    // Create Folder.
    this.props.createCollectionFolders(now);

    // Create stored data.
    let coll = this.state.collections;
    coll.push({
        name:'',
        protocole:'',
        place:{lat:'', long:'', name:''},
        date:now,
    });

    this.setState({ 
      collections: coll,
      editing:coll.length-1,
    }, function(){
      AsyncStorage.setItem('collections', JSON.stringify( this.state.collections ));
      AsyncStorage.setItem(now+'_collection', JSON.stringify({
        name:'',
        protocole:'',
        place:{lat:false,long:false,name:''}, 
        flower:{
          photo:'',
          id_flower_unknown:false,
          taxon_list_id_list:false,     // flower:taxa_taxon_list_id_list[]
          taxon_name:'',                // just for display on app.
          taxon_extra_info:'',
          comment:'',
        },

        environment:{
          photo:'',
          occAttr_3_1528533:false,      //  spontanée, plantée occAttr:3:1528533
          locAttr_2:'',     // NOT MANDATORY            //  ruche
          locAttr_1:[],   // NOT MANDATORY              //  habitat
          locAttr_3:false,                 //  grande culture en fleur
        },
      }));
      AsyncStorage.setItem(now+'_sessions', JSON.stringify([{
        date:'',
        time_start:'',
        time_end:'',
        smpAttr_24:'',
        smpAttr_25:'',
        smpAttr_26:'',
        shadow:'',
      }]));
      AsyncStorage.setItem(now+'_insects', JSON.stringify({
        date:'',
        time_start:'',
        time_end:'',
      }));
    });
  }

  selectCollection(index){
    if(this.state.selectItems!==false){
      let selectItems = this.state.selectItems;
      const i = selectItems.indexOf(index);
      if(i<0){
        selectItems.push(index);
      }
      else{
        selectItems.splice(i, 1);
      }
      this.setState({selectItems:selectItems}); 
    }
    else{
      this.setState({editing:index});   
    }
  }

  collectionChanged(key, val){
    if(key=='editing'){
      this.setState({[key]:val});
    }
    else{
      let coll = this.state.collections;
      coll[this.state.editing][key] = val;
      this.setState({collections:coll}, function(){
        AsyncStorage.setItem('collections', JSON.stringify( this.state.collections ));   
      })
    }
  }

  selectItems(index) {
    if(index===false){
      this.setState({selectItems:false});
    }
    else {
      this.setState({selectItems:[index]});
    }
  }

  deleteSelected(){
    Alert.alert(
      'Supprimer les collections sélectionées ?',
      'Toutes les informations et photos associées seront définitivement perdues.',
      [
        {
          text: 'Annuler',
          onPress: () => console.log('Cancel Pressed'),
        },
        {
          text: 'Supprimer', 
          onPress: () => {
            const selected = this.state.selectItems,
                  collections = this.state.collections;

            // Backward loop to avoid re-index issue.
            for (var i = selected.length - 1; i >= 0; i--) {
              const collection_name = this.state.collections[selected[i]].date;
              console.log(selected[i] + '  ' + collection_name);

              // Delete stored data.
              AsyncStorage.removeItem(collection_name+'_collection');
              AsyncStorage.removeItem(collection_name+'_sessions');
              AsyncStorage.removeItem(collection_name+'_insects');

              // Delete folder.
              this.props.deleteCollectionFolders(collection_name);

              // Remove from collection list.
              collections.splice(selected[i], 1);
              
            }
            // Store purged collection list.
            this.setState({
              collections:collections,
              selectItems:false,
            }, function(){
               AsyncStorage.setItem('collections', JSON.stringify( this.state.collections ));
            });
          }
        },
      ],
    );
  }

  render(){
    return(
       <View style={{flex:1}}>
        { this.state.editing === false
          ? <View style={{flex:1}}>

              { this.state.selectItems === false 
              ?
              <TouchableOpacity  
                style={{backgroundColor:greenFlash, flexDirection:'row', alignItems:'center', justifyContent:'center', height:50}}
                onPress = {() => this.newCollection()}
                >
                <MaterialCommunityIcons   
                  name='plus-circle-outline'
                  style={{fontSize:24, paddingRight:10, color:'white'}}
                />
                <Text style={{color: 'white', fontSize:16,}}>
                Créer une collection</Text>
              </TouchableOpacity>

              :
              <View  
                style={{alignItems:'center', backgroundColor:greenFlash,
                 height:50, flexDirection:'row'}}
                >
                <TouchableOpacity style={{flexDirection:'row', flex:0.5, height:50, alignItems:'center', justifyContent:'center',
                 borderRightWidth:1, borderRightColor:'white'}}
                  onPress = {() => this.deleteSelected()}
                  >
                  <MaterialCommunityIcons   
                    name='delete-circle'
                    style={{fontSize:24, paddingRight:10, color:'white'}}
                  /><Text style={{color: 'white', fontSize:16,}}>
                  Suprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{flexDirection:'row', flex:0.5, height:50, alignItems:'center', justifyContent:'center',}}
                  onPress = {() => this.selectItems(false)}
                  >
                  <MaterialCommunityIcons   
                    name='close-circle'
                    style={{fontSize:24, paddingRight:10, color:'white'}}
                  /><Text style={{color: 'white', fontSize:16,}}>
                  Annuler</Text>
                </TouchableOpacity>
              </View>
              }

              <ScrollView>
              { this.state.collections.map((value, index) => 
                <TouchableOpacity  
                  key={index}
                  style={[styles.listItem,  this.state.collections.length-1==index 
                    ? {borderBottomWidth:15}
                    : null
                  ]}
                  onPress = {() => this.selectCollection(index)}
                  onLongPress = {() => this.selectItems(index)}
                  >
                  { this.state.selectItems === false ? null :
                    <View style={{
                      // borderRadius:10,
                      margin:10, marginLeft:20,
                      height:20, width:20, borderWidth:1, borderColor:greenFlash, padding:1, 
                      
                    }}>
                       <View style={{
                        // borderRadius:10,
                        height:16, width:16,
                        backgroundColor: this.state.selectItems.indexOf(index)>=0
                          ? greenFlash
                          : 'transparent'
                      }}></View>
                    </View>
                  }
                  <Image
                    style={{ 
                      margin:1,
                      width:80,
                      height:80,
                    }}
                    resizeMode="contain"
                    source={{uri:'file://' + this.props.filePath + '/collections/' + value.date +'/flower.jpg' + '?t='+ new Date().getTime() }}
                  />
                  <Image
                    style={{ 
                      margin:1,
                      width:80,
                      height:80,
                    }}
                    resizeMode="contain"
                    source={{uri:'file://' + this.props.filePath + '/collections/' + value.date +'/environment.jpg' + '?t='+ new Date().getTime() }}
                  />

                  <View style={{padding:5, overflow:'hidden'}}>
                    <View style={{flexDirection:'row', flex:1}}>
                      <MaterialCommunityIcons
                        name={ value.protocole == 'flash' 
                        ? 'flash-outline' 
                        : value.protocole == 'long' 
                          ? 'timer-sand'
                          : 'help-circle-outline'
                        }
                        style={[styles.listItemText,{
                                                margin:0,
                                                  marginTop:7,
                                                }]}
                        size={18}
                      />

                      <Text style={[styles.listItemText, {fontWeight:'bold', fontSize:18}]}>
                      {value.name}</Text>
                    </View>
                    <View>
                      <Text style={styles.listItemText}>
                      {formatFolderName(value.date, false)}</Text>

                      <Text style={styles.listItemText}>
                      {value.place.name}</Text>
                    </View>
                </View>

                </TouchableOpacity>
              )}
              </ScrollView>           
            </View>

          : <React.Fragment>
              <CollectionForm 
                ref="collection-form"
                data={this.state.collections[this.state.editing]}
                valueChanged={(key,val) => this.collectionChanged(key,val)}

                filePath={this.props.filePath}
                pickPhoto = {(field) => this.props.pickPhoto('collection--'+this.state.collections[this.state.editing].date+'--'+field)}
              />
            </React.Fragment>

        }

      </View>
    );
  }

} // Main CollectionList


const styles = StyleSheet.create({ 

  collection_grp:{
    padding:15,
    paddingTop:10,
  },
  collSectionTitle:{
    flexDirection:'row', flex:1, justifyContent:'center', marginTop:20, marginBottom:1,
  },
  collSectionTitleText:{
    fontSize:18, 
    fontWeight:'bold',
    flex:1, 
    textAlign:'center',
    padding:5, 
    color:'white',
    backgroundColor:greenFlash,
  },

  collection_subgrp:{
    borderWidth:1, borderColor:'lightgrey', padding:10, marginBottom:20,
    // backgroundColor:greenSuperLight,
  },
  coll_subtitle:{
    fontSize:16,
    color:'grey',
    textAlign:'center',
    marginBottom:10,
  },
                
  titleTextStyle:{
    backgroundColor:greenFlash, 
    color:'white', 
    fontSize:18, 
    fontWeight:'bold', 
    textAlign:'center', 
    padding:10,
  },
  titleTextEdit:{
    backgroundColor:greenFlash, 
    color:'white', 
    fontSize:18, 
    fontWeight:'bold', 
    textAlign:'center', 
    padding:10,
  },
  titleInputStyle:{
    backgroundColor:greenFlash, 
    color:'white', 
    fontSize:18, 
    fontWeight:'bold', 
    textAlign:'center', 
    padding:10,
  },
  listItem:{
    padding:5,
    flexDirection:'row',
    borderBottomWidth:1,
    alignItems:'center',
    borderBottomColor:greenFlash,
    // height:50,
  },
  listItemText:{
    color:'grey',
    fontSize:14,
    paddingRight:5,
  },
  listItemNew:{
    backgroundColor:greenFlash,
  },

  collection_input_text:{
    padding:10, fontSize:16
  },



  // MapView

  map_container: {
    // ...StyleSheet.absoluteFillObject,
    height: 100,
    width: 100,
    },
  map: {
        height: 100,
    width: 10,
    // ...StyleSheet.absoluteFillObject,
  },
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
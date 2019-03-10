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

} from 'react-native'

import {

  CheckBox,

} from 'react-native-elements';

import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';
import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView from 'react-native-maps';

// Spipoll
import { flowerList } from './flowers.js';
const greenDark = "#231f20";
const green = "#d2e284";
const greenLight = "#e0ecb2";
const greenSuperLight ="#ecf3cd"
const greenFlash ="#92c83e";
const formatedDate = function(){
    now = new Date();
    year = "" + now.getFullYear();
    month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
    day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
    hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
    minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
    second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }

    return year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + second
  };


//-----------------------------------------------------------------------------------------
class ModalPlace extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: this.props.visible,

      name: this.props.location.name,
      lat: this.props.location.lat,
      lon: this.props.location.lon,

      region:{
        latitude: this.props.location.lat,
        longitude: this.props.location.lon,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
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
      fetch('https://maps.googleapis.com/maps/api/geocode/json'
        +'?address='+text
        +'&key='+GOOGLE_APIKEY)
      .then((response) => response.json())
      .then((responseJson) => {
        if(responseJson.status=="OK") {
          // console.log('geocode', responseJson.results[0].geometry.location);
          this.setState({ 
            name: text,
            lat: responseJson.results[0].geometry.location.lat,
            lon: responseJson.results[0].geometry.location.lng,
          }, function(){
            this.refs.lamap.animateToRegion({
              latitude:responseJson.results[0].geometry.location.lat,
              longitude:responseJson.results[0].geometry.location.lng,
              latitudeDelta:this.state.latitudeDelta,
              longitudeDelta:this.state.longitudeDelta,
            });
          });

          // Get timezone
          var summerDate = new Date();
          summerDate.setFullYear(summerDate.getFullYear()-1);
          summerDate.setMonth(6);
          summerDate = summerDate.getTime()/1000;
          fetch('https://maps.googleapis.com/maps/api/timezone/json'
            +'?location='
            +responseJson.results[0].geometry.location.lat+','
            +responseJson.results[0].geometry.location.lng
            +'&timestamp='+summerDate
            +'&key='+GOOGLE_APIKEY)
          .then((response) => response.json())
          .then((responseJson) => {
            // console.log('timezone', responseJson);
            if(responseJson.status=="OK") {
              this.setState({ 
                gmt: responseJson.rawOffset,
                dst: responseJson.dstOffset,
              });
            }
            else {
              this.setState({ 
                gmt: 0,
                dst: 0,
              });
            }
          })
          .catch((error) => { }); 
        }
        else {
          // console.log('api geocode ERROR:');
          // console.log(responseJson);
          this.setState({ 
            name: strings.unknownplace,
            lat: 0,
            lon: 0,
            gmt: 0,
            dst: 0,
          })
        }
      })
      .catch((error) => { 
        // console.log(error);
      }); 
    }
  }



  _renderSearchInput(){
    if (this.props.location.id>=0) return null;
    return (
      <View style={{margin:10}}>
        <MaterialCommunityIcons.Button   
          name="magnify"
          size={30}
        >
          <TextInput
            underlineColorAndroid='transparent'
            ref='searchText'
            style={{ 
              backgroundColor:'white', 
              flex:1,
              margin:0, 
              padding:3,
            }}
            onEndEditing =    {(event) => this.onSearchInput( event.nativeEvent.text) } 
            onSubmitEditing = {(event) => this.onSearchInput( event.nativeEvent.text) } 
          />
        </MaterialCommunityIcons.Button>
      </View>
    );
  }

  // onRegionChange(region) {

  // }

  onRegionChangeComplete(region) {
    this.setState({ 
      lat: region.latitude,
      lon: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    }); 

    if (this.props.location.id < 0 && region.latitude && region.longitude) {
      // Get place name
      fetch('https://maps.googleapis.com/maps/api/geocode/json?'
          +'latlng=' + region.latitude + ',' + region.longitude
          +'&location_type=APPROXIMATE&result_type=political'
          +'&language='+strings.getLanguage()
          +'&key='+GOOGLE_APIKEY)
      .then((response) => response.json())
      .then((responseJson) => {
        if(responseJson.status=="OK") {
          var storableLocation = {city:'',state:'',country:''};
          for (var ac = 0; ac < responseJson.results[0].address_components.length; ac++) {
            var component = responseJson.results[0].address_components[ac];

            switch(component.types[0]) {
                case 'locality':
                    storableLocation.city = component.long_name;
                    break;
                case 'administrative_area_level_1':
                    storableLocation.state = component.short_name;
                    break;
                case 'country':
                    storableLocation.country = component.long_name;
                    break;
            }
          }
          // console.log('geo code', responseJson.results[0]);
          this.setState({ 
            name: (storableLocation.city
                  ? storableLocation.city : storableLocation.state)
                  + ', '+ storableLocation.country,
          });
        }
        else {
          // console.log('api geocode ERROR:');
          // console.log(responseJson);
        }
      })
      .catch((error) => { 
        // console.log(error);  
      }); 

      // Get timezone
      var summerDate = new Date();
      summerDate.setFullYear(summerDate.getFullYear()-1);
      summerDate.setMonth(6);
      summerDate = summerDate.getTime()/1000;
      fetch('https://maps.googleapis.com/maps/api/timezone/json?location='+region.latitude+','+region.longitude+'&timestamp='+summerDate+'&key='+GOOGLE_APIKEY)
      .then((response) => response.json())
      .then((responseJson) => {
        if(responseJson.status=="OK") {
          this.setState({
            gmt: responseJson.rawOffset,
            dst: responseJson.dstOffset,
          });
        }
      })
      .catch((error) => {});
    }
  }

  _renderMap(){
    return(
      <View style={styles.map_container}  >

        <MapView style={styles.map} 
          ref="lamap"
          mapType="hybrid"
          initialRegion={{
            latitude: this.props.location.lat,
            longitude: this.props.location.lon,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }} 
          // region={this.region}
          // onRegionChange={this.onRegionChange.bind(this)}
          onRegionChangeComplete = { (region) => this.onRegionChangeComplete(region) } 
 
        />
        <View style={styles.target_h}  ></View>
        <View style={styles.target_v}  ></View>
      </View>   
    );
  }

  componentDidMount() {
    if (this.props.location.id < 0 ) {
      this.refs.searchText.focus(); 
    }
  }

  componentWillUnmount() {
    if (this.geocodeAddressPromise){
      this.geocodeAddressPromise.cancel();
    }
  }

  render() {
    return (
       <Modal
        // onRequestClose={onCancel}
   
        visible={this.props.visible}
      >

      <View style={styles.editLocation} >

        <ScrollView style={{marginTop:50}}>

          {this._renderSearchInput()}

          <TextInput
            underlineColorAndroid = 'transparent'
            defaultValue = {this.props.location.name}
            value = {this.state.name}
            onChangeText = {(text) => this.setState({name:text})}
            multiline = {true}
            numberOfLines = {2}
            style = {{ 
              backgroundColor:'white', 
              fontSize:22,
              margin:10, 
              padding:5,
            }}
          />

          {this._renderMap()}


        </ScrollView>

        <View style = {{position:'absolute', top:0, left:0, right:0, margin:0, flexDirection:'row', flex:1,}} >
     

            <View style={{flexDirection:'row', flex:1, justifyContent: 'flex-end'}} >
              
              <Text>dfgdfgdfgdfg</Text>

            </View>
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

  render(){
    console.log(this.state.source)
    if (this.state.source){
      return(
        <View style={[this.props.style, {
          flexDirection:'row',
          justifyContent: 'center',
          alignItems: 'center',
        }]}>
          <ImageView
            // title="0000000000000000"
            visible={this.state.visibleImageView}
            onCancel={this.hideImageView}
            source={this.state.source}
          />

          <View style={styles.iconButton2}>
          <MaterialCommunityIcons.Button   
            name='camera'
            underlayColor="#eeeeee"
            size={60}
            width={80}
            marginRight={10}
            color="#dddddd"//{greenSuperLight}
            backgroundColor ={'transparent'}
            // onPress = {() =>{}}
            onPress = {() => this.props.onPress()}
          /></View>

          <TouchableOpacity 
            style={{
                // borderColor:greenLight, borderWidth:1,
            }} 
            onPress={this.showImageView}
            >
            <Image
              style={{ 
                width:150,
                height:150,
              }}
              resizeMode="contain"
              source={this.state.source }
            />
          </TouchableOpacity>
        </View>
      );
    }
    else {
      return(
        <View style={this.props.style}>
          <View style={styles.iconButton2}>
            <MaterialCommunityIcons.Button   
              name='camera'
              underlayColor="#eeeeee"
              size={40}
              width={100}
              margin={0}
              paddingLeft={30}
              color="#eeeeee"
              backgroundColor ={'transparent'}
              // onPress = {() =>{}}
              onPress = {() => this.props.onPress()}
            /></View>
        </View>
      );
    }
  }

} // ImagePicker


//-----------------------------------------------------------------------------------------
class ModalHelp extends Component {
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
        <Text style={styles.titleTextStyle}>{this.props.title}</Text>
      </Modal>
    );
  }
}


//-----------------------------------------------------------------------------------------
class CollectionForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx)

    // TODO create collection / sessions folders

    this.state = {
      gpsOpacity:new Animated.Value(1),

      name: this.props.data.name,
      protocole: this.props.data.protocole,
      place:{
        long: this.props.data.place.long,
        lat: this.props.data.place.lat,
      },
      placeModalVisible: false,

      help:{
        visible:false,
        title:'',
      },

      collection:{

        flower:{
          photo:'',

          later:false,
          unknown:false,
          taxon_id:0,
          taxon_name:'',
          taxon_extra_info:'',
          comment:'',
        },
        location:{
          photo:'',
          flowerKind:'',
          habitat:'',
          ruche:'',
          culture50m:'',
        },


        //   Localiser 
        //     par  nom d'une commune, d'une région, d'un département ou d'un code postal
        //     No INSEE.
        //     GPS



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
      },
      visibleTaxonModal:false,
    };

    this.gpsSearching = false;
    this.toValue = 1;
  }

  componentWillMount(){
    // Load flower, sessions ...
  }

  componentDidMount(){
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.back();
      return true;
    });
  
    if(!this.state.name){
      this.refs['name'].focus();
    }
  }

  componentWillUnmount(){
     this.backHandler.remove();
    BackHandler.removeEventListener('hardwareBackPress', this.backButton);
  }

  upd_protocole(type){
    this.setState({collection:{
      ...this.state.collection,
      protocole:type,
    }}, function(){
      console.log(this.state.collection);
    });
  }

  selectTaxon = (picked) => {
    console.log(picked);
    this.setState({
      collection:{
        ...this.state.collection,
        flower:{
          ...this.state.collection.flower,
          taxon_id:picked.value,
          taxon_name:picked.label,
        },
      },
      visibleTaxonModal: false,
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

      // TODO: cancel if close form.
      this.watchID = navigator.geolocation.watchPosition(
        (position) => {
          console.log(position);
          navigator.geolocation.clearWatch(this.watchID);
          this.gpsSearching = false;

          // this.setState({collection:{
          //   ...this.state.collection,
          //   place:{
          //     lat:position.coords.latitude,
          //     long:position.coords.longitude, 
          //   },
          // }}, function(){
          //   console.log(this.state.collection);
          // });
          this.store('place',{
            lat:position.coords.latitude,
            long:position.coords.longitude, 
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

  convertDMS(deg) {
    var d = Math.floor (deg);
    var minfloat = (deg-d)*60;
    var m = Math.floor(minfloat);
    var secfloat = (minfloat-m)*60;
    var s = Math.round(secfloat);
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
    return "" + d + "° " + m + "' " + s + "'' ";
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

  store(key, value){
    if(value){
      this.setState({[key]:value}, function(){
        this.props.valueChanged(key,value);
      })     
    }
    else{
      this.setState({[key]:this.tempValue});
    }
  }

  edit(field){
    this.tempValue = this.state[field];
    this.setState({[field]:''}, function(){
      this.refs[field].focus();
    });
  }

  showPlaceModal(){
    this.setState({placeModalVisible:true});
  }
  hidePlaceModal(){
    this.setState({placeModalVisible:false});
  }

  back(){
    this.props.valueChanged('editing',false);
  }

  help(topic){
    this.setState({
      help:{visible:true, title:topic}
    })
  }

  hideHelpModal(){
    this.setState({
      help:{visible:false,}
    })
  }

  render () {
    console.log(  this.props.data);
    console.log( 'file://' + this.props.filePath + '/collections/' + this.props.data.date + '/flower.jpg');

    return (
      <View style={{flex:1}}>

          <ModalHelp
            visible={this.state.help.visible}
            title={this.state.help.title}
            titleTextStyle={styles.titleTextStyle}
            content={this.state.help.content}
            onCancel={() => this.hideHelpModal()} 
          />

          <ModalPlace
            visible = {this.state.placeModalVisible}
            location = {this.state.lat && this.state.lon
              ? {
                  id:this.state.editing, 
                  name:this.state.name,  
                  lat:this.state.lat, lon:this.state.lon 
                }
              : {id:-1, name:'', lat:0, lon:0} 
            }
            locationChanged = {this._updateLocation}
            onCancel={() => this.hidePlaceModal()} 

            // closeMe = {this._closeModal}
            // connected = {this.state.connected}
          />

          <View style={{flex:1}}>
            <View style={styles.collection_grp}>
              { this.state.name
                ? <View style={{flexDirection:'row'}}>
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
                      <Text style={styles.titleTextStyle}>{this.state.name}</Text>
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
                    onEndEditing = {(event) => this.store('name', event.nativeEvent.text)} 
                    onSubmitEditing = {(event) => this.store('name', event.nativeEvent.text)} 
                  />
              }

            </View>


            <ScrollView>

              <TouchableOpacity 
                style={{flexDirection:'row', flex:1, justifyContent:'center', marginTop:20,}}
                onPress = {() => this.help('protocole')} 
                >
                <Text style={{
                  fontSize:18, fontWeight:'bold',/* flex:1, textAlign:'center',*/ 
                  padding:10,color:greenFlash, backgroundColor:'transparent'}}>
                PROTOCOLE</Text>
                <MaterialCommunityIcons
                  name="help-circle-outline" 
                  style={[{color:greenFlash, paddingTop:10, backgroundColor:'transparent'} ]}
                  size={15}
                  backgroundColor = 'transparent'
                />
              </TouchableOpacity>
  
              <View style={[styles.collection_subgrp, {flexDirection:'row', flex:1, padding:10}]}>
                      
                <TouchableOpacity 
                  style={{ marginRight:5, padding:2,
                    flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center',
                    borderWidth:1, borderColor:this.state.protocole=='flash'?greenFlash:'grey',
                  }}
                  onPress = {() => this.store('protocole','flash')} 
                  >
                  <MaterialCommunityIcons
                    name="flash" 
                    style={{
                      backgroundColor:'transparent',
                      color:this.state.protocole=='flash'?greenFlash:'grey',
                    }}
                    size={25}
                  />
                  <Text style={{fontSize:16,
                    color:this.state.protocole=='flash'?greenFlash:'grey'
                    }}>
                  Flash</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ marginLeft:5, padding:2,
                    flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center',
                    borderWidth:1, borderColor:this.state.protocole=='long'?greenFlash:'grey',
                    }}
                  onPress = {() => this.store('protocole','long')} 
                  >
                  <MaterialCommunityIcons
                    name="timer-sand" 
                    style={{
                      backgroundColor:'transparent',
                      color:this.state.protocole=='long'?greenFlash:'grey',
                    }}
                    size={25}
                  />
                  <Text style={{ fontSize:16,
                    color:this.state.protocole=='long'?greenFlash:'grey',
                    }}>
                  Long</Text>
                </TouchableOpacity>

            </View>



              <TouchableOpacity 
                style={{flexDirection:'row', flex:1, justifyContent:'center'}}
                onPress = {() => this.help('protocole')} 
                >
                <Text style={{
                  fontSize:18, fontWeight:'bold',/* flex:1, textAlign:'center',*/ 
                  padding:10,color:greenFlash, backgroundColor:'transparent'}}>
                LIEU</Text>
              </TouchableOpacity>

              <View style={[styles.collection_subgrp, {flexDirection:'row', flex:1, justifyContent: 'space-between'}]}>
                <Text style={{fontSize:16}}> </Text>
                <Text style={{fontSize:16,
                  color:'grey'
                  }}
                  >
                  { typeof this.state.place.lat == 'number'
                    ? ( ' '
                      + this.convertDMS(this.state.place.lat) 
                      + '' + (this.state.place.lat>0 ? "E" : "W")
                      // + ' (' + this.state.place.lat.toFixed(6) +')'
                      )
                    : this.state.place.lat
                  }
                </Text>
                <Text style={{fontSize:16}}> / </Text>

                <Text style={{ fontSize:16,
                  color:'grey',
                  }}
                  >
                  {
                    typeof this.state.place.long == 'number'
                    ? ( ' '
                      + this.convertDMS(this.state.place.long, 'long') 
                      + '' + (this.state.place.long>0 ? "N" : "S")
                      // + ' (' + this.state.place.long.toFixed(6) +')'
                      )
                    : this.state.place.long
                  }
                </Text>
                <Text style={{fontSize:16}}> </Text>
              </View>

                                  <View style={[styles.collection_subgrp, {flexDirection:'row', flex:1, padding:10}]}>

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
                                              // style={styles.iconButton}
                                              // borderRadius={0}
                                              // padding={10}
                                              // paddingLeft={0}
                                              margin={0}
                                              // marginLeft={2}
                                              color={greenFlash}
                                              backgroundColor = 'transparent'
                                            />
                                          </Animated.View>
                                          <MaterialCommunityIcons
                                            name="crosshairs"
                                            size={0}
                                            height={40}
                                            width={60}
                                            // style={styles.iconButton}
                                            // borderRadius={0}
                                            // padding={10}
                                            // paddingLeft={0}
                                            margin={0}
                                            // marginLeft={2}
                                            color={greenFlash}
                                            backgroundColor = 'transparent'
                                            
                                          />
                                        </View>
                                        <Text style={{fontSize:16, marginLeft:15,
                                          color: this.gpsSearching  ? greenFlash:'grey'
                                          }}>
                                        Localiser</Text>

                                      </TouchableOpacity>

                                      <TouchableOpacity 
                                        style={{ marginLeft:5,
                                          flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center', borderWidth:1,
                                          borderColor:this.state.protocole=='long'?greenFlash:'grey',
                                          }}
                                        onPress = {() => this.editLocation()} 
                                        >
                                        <MaterialCommunityIcons
                                          name="magnify"  // search-web  magnify  map-search
                                          style={{
                                            backgroundColor:'transparent',
                                            color:this.state.protocole=='long'?greenFlash:'grey',
                                          }}
                                          size={25}
                                        />
                                        <Text style={{ fontSize:16,
                                          color:this.state.protocole=='long'?greenFlash:'grey',
                                          }}>
                                        Chercher</Text>
                                      </TouchableOpacity>

                                  </View>

              <View 
                style={{flexDirection:'row', flex:1, justifyContent:'center'}}
                // onPress = {() => this.help('protocole')} 
                >
                <Text style={{
                  fontSize:18, fontWeight:'bold',/* flex:1, textAlign:'center',*/ 
                  padding:10,color:greenFlash, backgroundColor:'transparent'}}>
                Station Florale</Text>
              </View>


            <View style={styles.collection_grp}>
              <Text style={styles.coll_title}>
              STATION FLORALE
              </Text>

              <View style={styles.collection_subgrp}>

                <Text style={styles.coll_subtitle}>
                Gros plan de la fleur</Text>
                <ImagePicker 
                  ref="collection-flower"
                  style={{
                    // borderWidth:1, borderColor:greenLight,
                    // width:150,
                    // height:150,
                  }}
                  onPress = {() => this.props.pickPhoto('flower')}
                  crop={{w:150,h:150}}
                  size={{w:150,h:150}}
                  source={{uri:'file://' + this.props.filePath + '/collections/' + this.props.data.date + '/flower.jpg'}}
                />
                </View>

                <CheckBox
                  containerStyle={styles.collection_input_container}
                  textStyle={styles.collection_input_text}
                  checkedColor = {greenFlash}
                  uncheckedColor = {greenDark}
                  title={'Faire confiance en l\'IA'}
                  checkedIcon='dot-circle-o'
                  uncheckedIcon='circle-o'
                  checked={this.state.collection.protocole != 'Flash'}
                  onPress = {() => this.upd_protocole('Long')}
                />

                <CheckBox
                  containerStyle={styles.collection_input_container}
                  textStyle={styles.collection_input_text}
                  checkedColor = {greenFlash}
                  uncheckedColor = {greenDark}
                  title={'Je ne connais pas le nom de cette fleur'}
                  checkedIcon='dot-circle-o'
                  uncheckedIcon='circle-o'
                  checked={this.state.collection.protocole != 'Flash'}
                  onPress = {() => this.upd_protocole('Long')}
                />

                <View style={styles.modalpickercontainer}>
                  <TouchableOpacity 
                    style={styles.buttonContainer} 
                    onPress={this.showTaxonModal}
                    >
                    <Text>Vous connaissez le taxon correspondant à cette fleur</Text>
                  </TouchableOpacity>      
                  <Text>{this.state.collection.flower.taxon_name}</Text>
                  <ModalFilterPicker
                    visible={this.state.visibleTaxonModal}
                    title='Fleur'
                    titleTextStyle={styles.titleTextStyle}
                    options={flowerList}
                    onSelect={this.selectTaxon}
                    onCancel={this.hideTaxonModal}
                  />
                </View>

                <TextInput
                  style={styles.collection_input_text}
                  placeholder='Vous connaissez une dénomination plus précise'
                />

                <TextInput
                  multiline={true}
                  numberOfLines={3} 
                  containerStyle={styles.collection_input_container}
                  placeholder='Commentaires'
                />

              </View>

              <View style={styles.collection_grp}>
                <Text style={styles.coll_title}>
                ENVIRONEMENT
                </Text>

                <View style={styles.collection_subgrp}>

                <Text style={styles.coll_subtitle}>
                Environnement de la fleur</Text>
                <Text style={styles.coll_info}>
                l'environnement  de la plante (à 2-3 mètres de celle-ci).</Text>
                
                <ImagePicker 
                // TODO ? multiple photos before user choose at the end ?
                  ref="collection-environment"
                  style={{
                    // borderWidth:1, borderColor:greenLight,
                    // width:150,
                    // height:150,
                  }}
                  onPress = {() => this.props.pickPhoto('environment')}
                  crop={{w:150,h:150}}
                  size={{w:150,h:150}}
                  source={{uri:'file://' + this.props.filePath + '/collections/' + this.props.data.date + '/environment.jpg'}}
                />

                </View>

                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  La plante est</Text>

                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'spontanée.'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'plantée.'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'ne sais pas.'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                </View>

                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  Distance approximative entre votre fleur et la ruche d'abeilles domestiques la plus proche (en mètres; par exemple : 150)</Text>
                  <TextInput
                    keyboardType="number-pad"
                    style={styles.collection_input_text}
                    placeholder='0'
                  />
                </View>


                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  Présence dans un rayon de 50m d'une grande culture en fleur</Text>

                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'oui'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'non'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'ne sais pas'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                </View>

                <View style={styles.collection_subgrp}>
                  <Text style={styles.coll_subtitle}>
                  Type d'habitat</Text>

                  {/* multi select */}
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'urbain'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'péri-urbain'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'rural'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'grande(s) culture(s)'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'forêt'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'prairie'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'littoral'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'parc ou jardin public'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'jardin privé'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'rochers'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'bord de route'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                  <CheckBox
                    containerStyle={styles.collection_input_container}
                    textStyle={styles.collection_input_text}
                    checkedColor = {greenFlash}
                    uncheckedColor = {greenDark}
                    title={'bord de l\'eau'}
                    checkedIcon='dot-circle-o'
                    uncheckedIcon='circle-o'
                    checked={this.state.collection.protocole != 'Flash'}
                    onPress = {() => this.upd_protocole('Long')}
                  />
                </View>

            </View>
            <View style={styles.collection_grp}>
                <Text style={styles.coll_title}>
                LOCALISATION
                </Text>

                <TouchableOpacity 
                  style={styles.row}
                  onPress ={ () => this.geoLoc() }
                  >
                  <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding:10,
                    }}
                    >
                    <Animated.View style={[{position:'absolute'}, { opacity: this.state.gpsOpacity }]}>
                      <MaterialCommunityIcons
                        name="crosshairs-gps" 
                        size={30}
                        height={40}
                        width={60}
                        // style={styles.iconButton}
                        // borderRadius={0}
                        // padding={10}
                        // paddingLeft={0}
                        margin={0}
                        // marginLeft={2}
                        color={greenFlash}
                        backgroundColor = 'transparent'
                      />
                    </Animated.View>
                    <MaterialCommunityIcons
                      name="crosshairs"
                      size={30}
                      height={40}
                      width={60}
                      // style={styles.iconButton}
                      // borderRadius={0}
                      // padding={10}
                      // paddingLeft={0}
                      margin={0}
                      // marginLeft={2}
                      color={greenFlash}
                      backgroundColor = 'transparent'
                      
                    />
                  </View>

                  <View style={{paddingTop:5}}>
                    <Text>Latitude: 
                      { typeof this.state.place.lat == 'number'
                        ? ( ' '
                          + this.convertDMS(this.state.place.lat) 
                          + '' + (this.state.place.lat>0 ? "E" : "W")
                          // + ' (' + this.state.place.lat.toFixed(6) +')'
                          )
                        : this.state.place.lat
                      }
                    </Text>
                    <Text>Longitude: 
                      {
                        typeof this.state.place.long == 'number'
                        ? ( ' '
                          + this.convertDMS(this.state.place.long, 'long') 
                          + '' + (this.state.place.long>0 ? "N" : "S")
                          // + ' (' + this.state.place.long.toFixed(6) +')'
                          )
                        : this.state.place.long
                      }
                    </Text>
                  </View>
                </TouchableOpacity>

                <TextInput

                  style={styles.collection_input_text}
                  placeholder='Code postale'
                />
            </View>


      </ScrollView>
      </View>
      </View>
    );
  }
}


//=========================================================================================
export default class CollectionList extends Component {
//-----------------------------------------------------------------------------------------
 constructor(props) {
    super(props);

    this.state = {
      collections:[],
      editing:false,
    };
  }

  componentWillMount(){
 
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
  }


  componentWillUnmount(){
    console.log('LIST UN-MOUNT');
  }

  setSource(collection, field, source){
    // this.setState({
    //   editing:collection,
    // }, function(){

    //   console.log(field,source)

      this.refs['collection-form'].refs['collection-'+field].setSource(source);
    // });
  }

  newCollection(){
    
    const now = formatedDate();
    this.props.createCollectionFolders(now);

    let coll = this.state.collections;
    coll.push({
        name:'',
        protocole:'',
        place:{lat:'', long:''},
        date:now,
    });

    this.setState({ 
      collections: coll,
      editing:coll.length-1,
    }, function(){
      AsyncStorage.setItem('collections', JSON.stringify( this.state.collections ));
    });
  }

  selectCollection(index){
    this.setState({editing:index});
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

  render(){
    return(
       <View style={{flex:1}}>
        { this.state.editing === false
          ? <View style={{flex:1}}>
              <TouchableOpacity  
                style={[styles.listItem,styles.listItemNew]}
                onPress = {() => this.newCollection()}
                >
                <MaterialCommunityIcons   
                  name='plus-circle-outline'
                  style={{fontSize:24, paddingRight:10, color:'white'}}
                />
                <Text style={{color: 'white', fontSize:16,}}>
                Créer une collection</Text>
              </TouchableOpacity>

              <ScrollView>
              { this.state.collections.map((value, index) => 
                <TouchableOpacity  
                  key={index}
                  style={styles.listItem}
                  onPress = {() => this.selectCollection(index)}
                  >

                  <Image
                    style={{ 
                      width:50,
                      height:50,
                    }}
                    resizeMode="contain"
                    source={{uri:'file://' + this.props.filePath + '/collections/' + value.date +'/flower.jpg' + '?t='+ new Date().getTime() }}
                  />
                  <Image
                    style={{ 
                      width:50,
                      height:50,
                    }}
                    resizeMode="contain"
                    source={{uri:'file://' + this.props.filePath + '/collections/' + value.date +'/environment.jpg' + '?t='+ new Date().getTime() }}
                  />

                  <MaterialCommunityIcons
                    name={ value.protocole == 'flash' 
                    ? 'flash-outline' 
                    : value.protocole == 'long' 
                      ? 'timer-sand'
                      : 'help-circle-outline'
                    }
                    style={{
                      backgroundColor:'transparent',
                      color:'grey',
                      width:20,
                      marginRight:5,
                    }}
                    size={18}
                  />

                  <Text style={[styles.listItemText, {fontWeight:'bold'}]}>
                  {value.name}</Text>

                  <Text style={styles.listItemText}>
                  {value.date}</Text>

               

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
  titleTextStyle:{
    flex:1,
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
    padding:10,
    flexDirection:'row',
    borderBottomWidth:1,
    alignItems:'center',
    borderBottomColor:greenFlash,
    // height:50,
  },
  listItemText:{
    color:'grey',
    fontSize:14,
    paddingRight:10,
  },
  listItemNew:{
    backgroundColor:greenFlash,
  },

  collection_input_text:
  {padding:10, fontSize:16},
});
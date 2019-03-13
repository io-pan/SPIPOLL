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
} from 'react-native'

import {


} from 'react-native-elements';

import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';
import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView from 'react-native-maps';
import { GOOGLE_APIKEY } from './googleAPIKEY.js';

// Spipoll
import { flowerList } from './flowers.js';
const greenDark = "#231f20";
const green = "#bcd151";
const greenLight = "#e0ecb2";
const greenSuperLight ="#ecf3cd"
const greenFlash ="#92c83e";
const date2folderName = function(){
  now = new Date();
  year = "" + now.getFullYear();
  month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
  day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
  hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
  minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
  second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }

  return year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + second;
};

const formatFolderName = function(str, sec){
  const mois = ['janv.', 'fév.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'nov.', 'déc.']
  str = str.split('_');
  d = str[0].split('-');
  t = str[1].split('-');
  return d[2] +  ' ' + mois[parseInt(d[1])] +  ' ' + d[0] + ', ' + t[0]+':'+ t[1] + (sec?':'+t[2] : '');
}

const deg2dms = function(deg, latlon) {
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


  return "" + d + ":" + m + ":" + s + ":" + card;
}
const dmsFormat = function(dms){
  dms = dms.split(':');
  return "" + dms[0] + "°" +dms[1] + "'" + dms[2] + "''" + dms[3];
}

//-----------------------------------------------------------------------------------------
class ModalPlace extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);

    console.log('ModalPlace');
     console.log(props);
    this.state = {
      visible: this.props.visible,

      name: this.props.name?this.props.name:'',
      lat: this.props.lat?this.props.lat:46.77735,
      lon: this.props.lon?this.props.lon:2.97499,

      region:{
        latitude: this.props.lat?this.props.lat:46.77735,
        longitude: this.props.lon?this.props.lon:2.97499,
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
    console.log('onSearchInput', text);
    if (text) {
      fetch('https://maps.googleapis.com/maps/api/geocode/json'
        +'?address='+text
        +'&key='+GOOGLE_APIKEY)
      .then((response) => response.json())
      .then((responseJson) => {

        // console.log(responseJson);

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

        
        }
        else {
          // console.log('api geocode ERROR:');
          // console.log(responseJson);
          this.setState({ 
            name: 'Lieu inconnu',
            lat: 46.77735,
            lon: 2.97499,
          })
        }
      })
      .catch((error) => { 
        console.log(error);
      }); 
    }
  }

  onRegionChangeComplete(region) {
    this.setState({ 
      lat: region.latitude,
      lon: region.longitude,
      latitudeDelta: 0.002,
      longitudeDelta: 0.002,
    }); 

    if (region.latitude && region.longitude) {
      // Get place name
      fetch('https://maps.googleapis.com/maps/api/geocode/json?'
          +'latlng=' + region.latitude + ',' + region.longitude
          +'&location_type=APPROXIMATE&result_type=political'
          +'&language=fr'
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

    }
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
                latitude: this.props.lat?this.props.lat:46.77735,
                longitude: this.props.lon?this.props.lon:2.97499,
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

  render(){
   
      return(
        <View style={[this.props.style, {
          flex:1,
          flexDirection:'row',
          justifyContent: 'center',
          alignItems: 'center',
        }]}>
          <ImageView
            title={this.props.title}
            visible={this.state.visibleImageView}
            onCancel={this.hideImageView}
            source={this.state.source}
            titleTextStyle={{color:greenFlash, fontWeight:'bold',fontSize:16}}
            cancelButtonTextStyle={{color:greenFlash, fontWeight:'bold',fontSize:16}}
          />

          <TouchableOpacity 
            style={{alignItems:'center', justifyContent:'center', flex:1}}
            onPress = {() => this.props.onPress()}
            >
            <Text style={{textAlign:'center', fontSize:16, color:'grey'}}>
              {this.props.title}</Text>
            <MaterialCommunityIcons   
              name='camera'
              size={50}
              backgroundColor='transparent'
              color="lightgrey"           
            />
          </TouchableOpacity>

          { this.state.source
            ? <TouchableOpacity 
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
          : null
        }
        </View>
      );
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
        <ScrollView>
          <View style={{padding:15}}>
          <Text>yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov yxcyxcyxcyx cy csdl fhfsod vsdov </Text>
          </View>
          <Text style={styles.titleTextStyle}></Text>
        </ScrollView>
        
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
      connected:false,
      
      visibleTaxonModal:false,
      visiblePlaceModal:false,

      help:{
        visible:false,
        title:'',
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

  componentWillMount(){
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
  }

  componentDidMount(){
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

      // TODO: cancel if close form.
      this.watchID = navigator.geolocation.watchPosition(
        (position) => {
          console.log(position);
          navigator.geolocation.clearWatch(this.watchID);
          this.gpsSearching = false;

          this.storeListItem('place',{
            ...this.state.collection.place,
            lat:position.coords.latitude,
            long:position.coords.longitude, 
            
          });

            // Get place name
            fetch('https://maps.googleapis.com/maps/api/geocode/json?'
                +'latlng=' +position.coords.latitude + ',' + position.coords.longitude
                +'&location_type=APPROXIMATE&result_type=political'
                +'&language=fr'
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
                this.storeListItem('place', { 
                  ...this.state.collection.place,
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
      help:{visible:true, title:topic}
    })
  }

  hideHelpModal(){
    this.setState({
      help:{visible:false,}
    })
  }

  render () {
    console.log('render CollectionForm state', this.state);
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

          <View style={{flex:1}}>
            <View>
              { this.state.collection.name
                ? <View style={{flexDirection:'row', borderBottomWidth:1, borderBottomColor:'white', }}>
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

            </View>


            <ScrollView>

              <TouchableOpacity 
                style={{flexDirection:'row', flex:1, justifyContent:'center', marginTop:20,}}
                onPress = {() => this.help('protocole')} 
                >
                <Text style={{
                  fontSize:18, fontWeight:'bold',/* flex:1, textAlign:'center',*/ 
                  padding:5, color:greenFlash, backgroundColor:'transparent'}}>
                PROTOCOLE</Text>
                <MaterialCommunityIcons
                  name="help-circle-outline" 
                  style={[{color:greenFlash, paddingTop:10, backgroundColor:'transparent'} ]}
                  size={15}
                  backgroundColor = 'transparent'
                />
              </TouchableOpacity>
  
              <View style={[styles.collection_grp, {flexDirection:'row', flex:1}]}>      
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


           
              <View style={styles.collSectionTitle}>
                <Text style={styles.collSectionTitleText}>
                Lieu</Text>
              </View>

              <View style={styles.collection_grp}>
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
                    { dmsFormat(deg2dms(this.state.collection.place.lat, 'lat')) + '   ' + dmsFormat(deg2dms(this.state.collection.place.long, 'lon'))}
                  </Text>
                </View>
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

                { this.state.connected && this.state.connected.type != 'none'
                  ? <TouchableOpacity 
                      style={{ marginLeft:5,
                        flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center', borderWidth:1,
                        borderColor:this.state.protocole=='long'?greenFlash:'grey',
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
                  : null
                }
              </View>


              <View style={styles.collSectionTitle}>
                <Text style={styles.collSectionTitleText}>
                Station Florale</Text>
              </View>

              <ImagePicker 
                ref="collection-flower"
                style={{margin:15, marginTop:0,
                  // borderWidth:1, borderColor:'lightgrey',
                }}
                title={'Gros plan de la fleur'}
                onPress = {() => this.props.pickPhoto('flower')}
                crop={{w:150,h:150}}
                size={{w:150,h:150}}
                source={{uri:'file://' + this.props.filePath + '/collections/' + this.props.data.date + '/flower.jpg'}}
              />

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
                    borderColor:'lightgrey', borderWidth:1}} 
                  onPress={()=>this.storeFlower('id_flower_unknown', !this.state.collection.flower.id_flower_unknown)}
                  >
                  <MaterialCommunityIcons
                    name= {this.state.collection.flower.id_flower_unknown ? "checkbox-marked" : "checkbox-blank-outline"}
                    style={{ 
                      color: greenFlash, padding:5, marginBottom:5,
                      backgroundColor:'transparent',
                    }}
                    size={25}
                  />
                  <Text style={{padding:5, fontSize:14, 
                    color:'grey'}}>
                  Je ne connais pas le nom de cette fleur</Text>
                </TouchableOpacity> 

                { this.state.collection.flower.id_flower_unknown
                  ? null
                  : <React.Fragment>
                      <TouchableOpacity 
                        style={{
                          overflow:'hidden', marginBottom:10,
                          flexDirection:'row', flex:1, alignItems:'center',
                          borderColor:'lightgrey', borderWidth:1}} 
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
                Environnement de la fleur</Text>
              </View>

                <ImagePicker 
                  // TODO ? multiple photos before user choose at the end ?
                  title={'Fleur à 2-3 mètres de distance'}
                  ref="collection-environment"
                  style={{margin:15, marginTop:0,
                    // borderWidth:1, borderColor:'lightgrey', 
                  }}
                  onPress = {() => this.props.pickPhoto('environment')}
                  crop={{w:150,h:150}}
                  size={{w:150,h:150}}
                  source={{uri:'file://' + this.props.filePath + '/collections/' + this.props.data.date + '/environment.jpg'}}
                />

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
                    style={{borderWidth:1, margin:5, padding:5,
                      borderColor:greenFlash 
                    }}
                    onPress = {() => this.storeEnvironment('occAttr_3_1528533',108)}
                    ><Text style={{fontSize:14,
                      color: this.state.collection.environment.occAttr_3_1528533==108 ? greenFlash : 'grey',
                    }}>
                    Spontanée</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash
                    }}
                    onPress = {() => this.storeEnvironment('occAttr_3_1528533',109)}
                    ><Text style={{fontSize:14,
                      color: this.state.collection.environment.occAttr_3_1528533==109 ? greenFlash : 'grey',
                    }}>
                    Plantée</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
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
                Distance approximative entre votre fleur et la ruche d'abeilles domestiques la plus proche en mètres.</Text>
                <Text style={styles.coll_subtitle}>
                Par exemple : 150</Text>
                <View style={{alignItems:'center', margin:0, padding:0}}>
                <TextInput
                  keyboardType="number-pad"
                  style={{ margin:5,borderWidth:1, width:50, padding:0,
                    textAlign:'center',
                    fontSize:16,
                    color:greenFlash,
                    borderColor:'lightgrey', }} 
                  defaultValue={''+this.state.collection.environment.locAttr_2}
                  onEndEditing =    {(event) => this.storeEnvironment( 'locAttr_2', isNaN(parseInt(event.nativeEvent.text),10)?0:parseInt(event.nativeEvent.text),10)} 
                  onSubmitEditing = {(event) => this.storeEnvironment( 'locAttr_2', isNaN(parseInt(event.nativeEvent.text),10)?0:parseInt(event.nativeEvent.text),10)}               
                /></View>
              </View>

              <View style={styles.collection_subgrp}>
                <Text style={styles.coll_subtitle}>
                Présence dans un rayon de 50m d'une grande culture en fleur</Text>
                <View style={{
                  flexDirection:'row',
                  alignItems:'space-between',
                  justifyContent:'center',
                   // alignItems: 'flex-start',
                }}>
                  <TouchableOpacity
                    style={{borderWidth:1, margin:5, padding:5,
                      borderColor:greenFlash 
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_3',140)}
                    ><Text style={{fontSize:14,
                      color: this.state.collection.environment.locAttr_3==140 ? greenFlash : 'grey',
                    }}>
                    Oui</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_3',141)}
                    ><Text style={{fontSize:14,
                      color: this.state.collection.environment.locAttr_3==141 ? greenFlash : 'grey',
                    }}>
                    Non</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
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
                    style={{borderWidth:1, margin:5, padding:5,
                      borderColor:greenFlash ,
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',111)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(111)!==-1 ? greenFlash : 'grey',
                    }}>
                    urbain</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',112)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(112)!==-1 ? greenFlash : 'grey',
                    }}>
                    péri-urbain</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash,
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',113)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(113)!==-1 ? greenFlash : 'grey',
                    }}>
                    rural</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1, margin:5, padding:5,
                      borderColor:greenFlash 
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',114)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(114)!==-1 ? greenFlash : 'grey',
                    }}>
                    grande culture</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',115)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(115)!==-1 ? greenFlash : 'grey',
                    }}>
                    forêt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash,
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',116)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(116)!==-1 ? greenFlash : 'grey',
                    }}>
                    prairie</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{borderWidth:1, margin:5, padding:5,
                      borderColor:greenFlash 
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',117)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(117)!==-1 ? greenFlash : 'grey',
                    }}>
                    littoral</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',118)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(118)!==-1 ? greenFlash : 'grey',
                    }}>
                    parc, jardin public</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash,
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',119)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(119)!==-1 ? greenFlash : 'grey',
                    }}>
                    jardin privé</Text>
                  </TouchableOpacity>
                    <TouchableOpacity
                    style={{borderWidth:1, margin:5, padding:5,
                      borderColor:greenFlash 
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',120)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(120)!==-1 ? greenFlash : 'grey',
                    }}>
                    rochers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
                      borderColor:greenFlash
                    }}
                    onPress = {() => this.storeEnvironment('locAttr_1',121)}
                    ><Text style={{fontSize:14,
                      color:this.state.collection.environment.locAttr_1.indexOf(121)!==-1 ? greenFlash : 'grey',
                    }}>
                    bord de route</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{borderWidth:1,margin:5, padding:5,
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


            <View style={styles.collSectionTitle}>
              <Text style={styles.collSectionTitleText}> </Text>
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
    
    const now = date2folderName();
    this.props.createCollectionFolders(now);

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
        place:{lat:0,long:0,name:''}, 
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
      }));
      AsyncStorage.setItem(now+'_sessions', JSON.stringify({
        date:'',
        time_start:'',
        time_end:'',
      }));
      AsyncStorage.setItem(now+'_insects', JSON.stringify({
        date:'',
        time_start:'',
        time_end:'',
      }));
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
                  style={[styles.listItem,  this.state.collections.length-1==index 
                    ? {borderBottomWidth:15}
                    : null
                  ]}
                  onPress = {() => this.selectCollection(index)}
                  >
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
  },
  coll_subtitle:{
    fontSize:16,
    color:'grey',
    textAlign:'center',
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
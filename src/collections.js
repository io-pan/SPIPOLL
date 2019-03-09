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
} from 'react-native'

import {
  Button,
  CheckBox,
  ListItem,
} from 'react-native-elements';

import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';
import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Spipoll
import { flowerList } from './flowers.js';
const greenDark = "#231f20";
const green = "#d2e284";
const greenLight = "#e0ecb2";
const greenSuperLight ="#ecf3cd"
const greenFlash ="#92c83e";
const formatedDate = function(type){
    now = new Date();
    year = "" + now.getFullYear();
    month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
    day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
    hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
    minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
    second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }

    if(type=='filename'){
      return year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + second;  
    }
    else{
      return year + "." + month + "." + day + " " + hour + ":" + minute + ":" + second; 
    }
  };

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
    console.log(source);
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
            source={this.state.source }
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
class CollectionForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx)

    // TODO create collection / sessions folders

    this.state = {
      gpsOpacity:new Animated.Value(1),

      name: this.props.data.name,
      protocole: this.props.data.protocole,

      collection:{

        place:{
          long:'',
          lat:'',
        },

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
    if(!this.state.name){
      this.refs['name'].focus();
    }
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
      this.setState({collection:{
        ...this.state.collection,
        place:{
          lat:'',
          long:'', 
        },
      }});

      this.watchID = navigator.geolocation.watchPosition(
        (position) => {
          console.log(position);
          navigator.geolocation.clearWatch(this.watchID);
          this.gpsSearching = false;

          this.setState({collection:{
            ...this.state.collection,
            place:{
              lat:position.coords.latitude,
              long:position.coords.longitude, 
            },
          }}, function(){
            console.log(this.state.collection);
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

  back(){
    this.props.valueChanged('editing',false);
  }

  render () {
    return (
      <ScrollView>
          <View style={styles.collection}>
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

            <View style={styles.collection_grp}>
              <Text style={styles.coll_title}>
              PROTOCOLE
              </Text>
              <View style={styles.collection_subgrp}>
              <CheckBox
                containerStyle={styles.collection_input_container}
                textStyle={styles.collection_input_text}
                checkedColor = {greenFlash}
                uncheckedColor = {greenDark}
                title={'Flash'}
                checkedIcon='dot-circle-o'
                uncheckedIcon='circle-o'
                checked={this.state.collection.protocole == 'Flash'}
                onPress = {() => this.upd_protocole('Flash')}
              />
              <Text style={styles.coll_info}>
              Une seule session photographique de 20mn.</Text>
              <CheckBox
                containerStyle={styles.collection_input_container}
                textStyle={styles.collection_input_text}
                checkedColor = {greenFlash}
                uncheckedColor = {greenDark}
                title={'Long'}
                checkedIcon='dot-circle-o'
                uncheckedIcon='circle-o'
                checked={this.state.collection.protocole != 'Flash'}
                onPress = {() => this.upd_protocole('Long')}
              />
              <Text style={styles.coll_info}>
              Une ou plusieurs sessions photographiques de plus de 20mn sur 3 jours maximum.</Text>
              {/*                            
              <Text style={styles.coll_info_grp}>
                    Dans les deux cas, 
                    l’objectif est d’avoir UNE photo par ce que vous considérez comme "espèce" d'insecte, 
                    de qualité suffisante pour certifier que ce spécimen 
                    diffère des autres spécimens de votre collection.
               </Text><Text style={styles.coll_info_grp}>
                    Pour chacune des espèces photographiées, 
                    vous aurez la possibilité de nous communiquer une information sur son abondance : 
                    y-a-t-il 1 seul individu ? Entre 2 et 5 ? Plus de 5 ?
              </Text>
                */}
              </View>
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
                  onPress = {() => this.props.pickPhoto('collection-flower')}
                  crop={{w:150,h:150}}
                  size={{w:150,h:150}}
                  source={{uri:'file://' +this.props.filePath + '/collection-flower.jpg'}}
                  // source={{uri:'file://'+'/storage/6465-6631/DCIM/Camera/PICT0357.JPG'}}

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
                  onPress = {() => this.props.pickPhoto('collection-environment')}
                  crop={{w:150,h:150}}
                  size={{w:150,h:150}}
                  source={{uri:'file://' +this.props.filePath + '/collection-environment.jpg'}}
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
                      { typeof this.state.collection.place.lat == 'number'
                        ? ( ' '
                          + this.convertDMS(this.state.collection.place.lat) 
                          + '' + (this.state.collection.place.lat>0 ? "E" : "W")
                          // + ' (' + this.state.collection.place.lat.toFixed(6) +')'
                          )
                        : this.state.collection.place.lat
                      }
                    </Text>
                    <Text>Longitude: 
                      {
                        typeof this.state.collection.place.long == 'number'
                        ? ( ' '
                          + this.convertDMS(this.state.collection.place.long, 'long') 
                          + '' + (this.state.collection.place.long>0 ? "N" : "S")
                          // + ' (' + this.state.collection.place.long.toFixed(6) +')'
                          )
                        : this.state.collection.place.long
                      }
                    </Text>
                  </View>
                </TouchableOpacity>

                <TextInput

                  style={styles.collection_input_text}
                  placeholder='Code postale'
                />
            </View>

          </View>
      </ScrollView>
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

  newCollection(){
    let coll = this.state.collections;
    coll.push({
        name:'',
        date:formatedDate(),
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
      <View>
        { this.state.editing === false
          ? <React.Fragment>
            <TouchableOpacity  
              style={[styles.listItem,styles.listItemNew]}
              onPress = {() => this.newCollection()}
              >
              <MaterialCommunityIcons   
                name='plus-circle-outline'
                style={{fontSize:24, paddingRight:10, color:'white'}}
              />
              <Text style={{color: 'white', fontSize:16,}}>
              Nouvelle Collection</Text>
            </TouchableOpacity>

            <ScrollView>
            { this.state.collections.map((value, index) => 
              <TouchableOpacity  
                key={index}
                style={styles.listItem}
                onPress = {() => this.selectCollection(index)}
                >
                <Text style={styles.listItemText}>
                {value.name}</Text>
                <Text style={styles.listItemText}>
                {value.date}</Text>

              </TouchableOpacity>
            )}
            </ScrollView>
            </React.Fragment>

          : <React.Fragment>
              <CollectionForm 
                data={this.state.collections[this.state.editing]}
                valueChanged={(key,val) => this.collectionChanged(key,val)}
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
    padding:20,
    paddingTop:10,
    paddingBottom:10,
    flexDirection:'row',
    borderBottomWidth:1,
    borderBottomColor:greenFlash,
  },
  listItemText:{
    color:'grey',
    fontSize:14,
  },
  listItemNew:{
    backgroundColor:greenFlash,
  },
});
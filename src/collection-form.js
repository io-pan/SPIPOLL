import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  Dimensions,

} from 'react-native'

import {
  Button,
  CheckBox,
  Input,
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
console.log(source);
console.log(this.state.source);
    source.uri = source.uri.substring(0, 
      source.uri.indexOf('?t=') < 0 
      ? source.uri.length
      : source.uri.indexOf('?t=')
      ) + '?t='+ new Date().getTime();
    console.log(source);
    this.setState({source:source});
  }

  showImageView = () => {
    console.log('showImageView');
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
export default class CollectionForm extends Component {
  //-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx)

    // TODO create collection / sessions folders

    this.state = {
      collection:{
        protocole:'Flash',
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
        place:{
          long:0,
          lat:0,
        }

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
  hideTaxon = () => {
    this.setState({visibleTaxonModal: false});
  }

  render () {
    return (

          <View style={styles.collection}>
            <View style={styles.collection_grp}>
              {/*<Text style={styles.coll_title}>Nom de la collection</Text>*/}
              <Input
                containerStyle={styles.collection_input_container}
                placeholder='Nom de la collection'
              />
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
              Une ou plusieurs sessions photographiques de plus de 20mn sur 3 jour maximum.</Text>
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
                  title={'Identifier plus tard'}
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
                    options={flowerList}
                    onSelect={this.selectTaxon}
                    onCancel={this.hideTaxon}
                  />
                </View>

                <Input
                  containerStyle={styles.collection_input_container}
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
                  <Input
                    containerStyle={styles.collection_input_container}
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
                <Input
                  // GPS + search
                  containerStyle={styles.collection_input_container}
                  placeholder='GPS'
                />
            </View>

          </View>

    );
  }
}

const styles = StyleSheet.create({ 
 collection:{
    backgroundColor:'white',
    padding:10,
  },
  coll_title:{
    marginLeft:10,
    color:'white',
    fontSize:18,
    fontWeight:'bold',
    paddingBottom:10,
    paddingTop:5,
  },
  coll_subtitle:{
    marginLeft:10,
    color:greenFlash,
    fontSize:16,
    fontWeight:'bold',
    paddingBottom:10,
    paddingTop:5,
  },
  coll_info:{
    color: green,
    fontSize:12,
    marginLeft:45,
    paddingRight:5,
    paddingBottom:5,
  },
  coll_info_grp:{
    fontSize:14,
    color: greenDark,
    padding:10,
  },

  collection_grp:{
    backgroundColor:greenLight,
    margin:5,
    borderWidth:1,
    borderColor:'#dddddd',
    borderRadius:10,
    
    paddingBottom:10,
    marginBottom:10,
  },
  collection_subgrp:{
    backgroundColor:'white',
    margin:5,
    borderWidth:1,
    borderColor:'#dddddd',
    borderRadius:10,
    
    paddingBottom:10,
    marginBottom:10,
  },

  collection_input_container:{
    margin:0,
    padding:0,
    backgroundColor:'white',
    borderWidth:0,
  },
  collection_input_text:{
    fontWeight:'normal',
    fontSize:16,
    color:greenDark,
  },
});
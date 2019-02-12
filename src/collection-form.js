import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native'

import {
  Button,
  CheckBox,
  Input,
  ListItem,
} from 'react-native-elements';
import ModalFilterPicker from './filterSelect'

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
    this.state = {};
  }

  render(){
    return(
      <View>
        <Image
        />
      </View>
    );
  }
}


//-----------------------------------------------------------------------------------------
export default class CollectionForm extends Component {
  //-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx)

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
      },
      visibleTaxonModal:false,
    };
  }


  coll_protocole(type){
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
    return(

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
                onPress = {() => this.coll_protocole('Flash')}
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
                onPress = {() => this.coll_protocole('Long')}
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
                <ImagePicker style={styles.collection_input_container}></ImagePicker>
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
                  onPress = {() => this.coll_protocole('Long')}
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
                  onPress = {() => this.coll_protocole('Long')}
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

                <Input
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
                
                <ImagePicker style={styles.collection_input_container}></ImagePicker>
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
                    onPress = {() => this.coll_protocole('Long')}
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
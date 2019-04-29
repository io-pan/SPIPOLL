import React, { Component } from 'react'
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

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import FooterImage from './footerimage';
// import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';

import {
  ImagePicker,
  ImageSlider, 
  Form,
} from './widgets.js';

// Spipoll data.
import { insectList } from './insects.js';
import { colors } from './colors';


//-----------------------------------------------------------------------------------------
export default class InsectForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx);

    this.form = {insect:[
      {
        name:'occAttr_4',
        type:'singleSelect',
        title:'Nombre maximum d\'individus de cette espèce vus simultanément',
        values: [ 
          {label:' 1 ',   value:123},
          {label:'entre 2 et 5',  value:124},
          {label:'plus de 5',  value:125},
          {label:'Ne sais pas', value:126},
        ],
      },
      {
        name:'occAttr_5',
        type:'singleSelect',
        title:'Insecte photographié sur la fleur de votre station florale',
        // Avez-vous photographié cet insecte AILLEURS que sur la fleur de votre station florale:
        values: [ 
          {label:'Oui', value:0},   // Question inversée ...
          {label:'Non', value:1},   // ... pour plus de clareté.
        ],
      },
    ]};

    this.state = {
      insect:this.props.data,
      // {
      //   taxon_list_id_list:this.props.data.taxon_list_id_list,
      //   taxon_name:this.props.data.taxon_name,
      //   taxon_extra_info:this.props.data.taxon_extra_info,
      //   comment:this.props.data.comment, 
      //   session:this.props.data.session,

      //   occAttr_4:this.props.data.occAttr_4, // Nombre maximum d'individus de cette espèce vus simultanément :
      //   occAttr_5:this.props.data.occAttr_5, // Avez-vous photographié cet insecte ailleurs que sur la fleur de votre station florale:
      
      //   selectedPhotoPath:false,
      // },
    };
  }

  storeInsect(field,value){
    if(field=='taxon'){
      this.setState({
        // insect:{
        //   ...this.state.insect,
        //   taxon_list_id_list:value.value,
        //   taxon_name:value.label,
        // },
        // visibleTaxonModal: false,
      },function(){
        // Update list. ... TODO: multival
        this.props.valueChanged('taxon_list_id_list', value.value);
        this.props.valueChanged('taxon_name', value.label);
      });
    }
    else{
      // this.setState({
      //   insect:{
      //     ...this.state.insect,
      //     [field]:value,
      //   }
      // },function(){
        this.props.valueChanged(field, value);
      // });    
    }
  }

  showTaxonModal = () => {
    this.refs['modal-insect-list'].show();
  }

  render(){
    console.log('render InsectForm');
    return(
        <ScrollView style={{flex:1}}>

              <View style={styles.collection_grp}>
                <ImagePicker
                  key="collection-insect"
                  title={this.state.insect.taxon_extra_info || this.state.insect.taxon_name || 'Non identifié' }
                  cam = {false}
                  styles={{
                    highlightColor:colors.greenFlash,
                    badColor:colors.purple,
                    container:{marginRight:5, flex:1, padding:5, borderWidth:1, borderColor:'lightgrey', backgroundColor:'white'}
                  }}

                  path={this.props.collection_storage + '/insects/' + this.props.data.date }
                  filename={this.state.insect.photo}
                  onSelect={(filename)=>this.storeInsect('photo', filename)}
                />
              </View>

              <View style={styles.collection_grp}>
                <TouchableOpacity 
                  style={{
                    marginBottom:10,
                    padding:1,
                    flexDirection:'row',
                    backgroundColor:'white', borderColor:'lightgrey', borderWidth:1}}
                  onPress={this.showTaxonModal}
                  >
                  <View
                    style={{ justifyContent:'center', alignItems:'center',
                      backgroundColor:colors.greenFlash,
                       padding:5, marginRight:5,
                      }}
                    >
                    <MaterialCommunityIcons
                      name="chevron-down" 
                      style={{ color:'white',backgroundColor:colors.greenFlash }}
                      size={22}
                    />
                  </View>
                  <Text style={{
                    flex:1,
                    padding:5,
                    fontSize:14,
                    backgroundColor:'white',
                    color:this.state.insect.taxon_list_id_list?colors.greenFlash:'grey'
                    }}>
                    { this.state.insect.taxon_list_id_list
                      ? this.state.insect.taxon_name
                      : 'Je choisis dans la liste'
                    }
                  </Text>
                </TouchableOpacity>      

                <TextInput
                  placeholder='Je connais une dénomination plus précise'
                  placeholderTextColor='grey'
                  style={{ flex:1, padding:4, marginBottom:5, borderWidth:1, 
                    fontSize:14,
                    backgroundColor:'white',
                    color:colors.greenFlash,
                    borderColor:this.state.insect.taxon_extra_info?colors.greenFlash:'lightgrey', }} 
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
                    padding:5, marginTop:15, marginBottom:20, borderColor:'lightgrey', borderWidth:1,}}
                  defaultValue ={this.state.insect.comment}
                  onEndEditing = {(event) => this.storeInsect('comment',event.nativeEvent.text) } 
                  onSubmitEditing = {(event) => this.storeInsect('comment', event.nativeEvent.text) }  
                />
   
                <Form
                  fields={this.form.insect}
                  currentValues={this.state.insect}
                  fieldChanged={(field, value) => this.storeInsect(field, value)}
                  styles={{
                    group:styles.collection_subgrp,
                    title:styles.coll_subtitle,
                    label:{backgroundColor:'white', borderWidth:1, margin:5, padding:5, borderColor:colors.greenFlash},
                    labelText:{fontSize:14, backgroundColor:'white'}, 
                    highlightColor:colors.greenFlash,
                    badColor:colors.purple,
                  }}
                />
              </View>

              <ModalFilterPicker
                ref={'modal-insect-list'}
                title="Taxon de l'insecte"
                highlightColor={colors.greenFlash}
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


const styles = StyleSheet.create({ 

  collection_grp:{
    padding:15,
    paddingTop:10,
  },

  collection_subgrp:{
    borderWidth:1, 
    borderColor:'lightgrey', 
    padding:10, 
    marginBottom:20,
  },

  coll_subtitle:{
    fontSize:16,
    color:'grey',
    textAlign:'center',
    marginBottom:10,
  },
                
  titleTextStyle:{
    backgroundColor:colors.greenFlash, 
    color:'white', 
    fontSize:18, 
    fontWeight:'bold', 
    textAlign:'center', 
    padding:10,
  },
});
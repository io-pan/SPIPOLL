import React, { Component } from 'react'
import {
  Alert,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  ScrollView,
  AsyncStorage,
  Modal,
  CheckBox,
  NativeModules,
} from 'react-native'

import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import FooterImage from './footerimage';
// import ImageView from './imageView';
import LoadingView from './loadingview';
import ModalFilterPicker from './filterSelect';
import {
  ModalHelp,
  ImagePicker,
  LocationPicker,
  Form,
  checkForm,
} from './widgets.js';

// Spipoll data.
import { flowerList } from './flowers.js';
import { colors } from './colors';

//-----------------------------------------------------------------------------------------
export default class  CollectionForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx)

    this.form = {
      environment:[
        {
          name:'occAttr_3_1528533',
          type:'singleSelect',
          title:'La plante est',
          values: [ 
            {label:'Spontanée',   value:108 },
            {label:'Plantée',     value:109 },
            {label:'Ne sais pas', value:110 },
          ],
        },{
          name: 'ocAttr_2',
          optional: true,
          type: 'int',
          title: " Distance approximative de la plus proche ruche d'abeilles domestiques.\n\n En mètres; par exemple : 150",
        },{
          name:'locAttr_3',
          type:'singleSelect',
          title:'Grande culture en fleur à moins de 50m',
          values: [ 
            {label:'Oui', value:140 },
            {label:'Non', value:141 },
            {label:'Ne sais pas', value:142 },
          ],
        },{
          name:'locAttr_1',
          type:'multiSelect',
          title:"Type d'habitat",
          values: [ 
            {label:'Urbain',          value:111},
            {label:'Péri-urbain',     value:112},
            {label:'Rural',           value:113},
            {label:'Grande culture',  value:114},
            {label:'Forêt',           value:115},
            {label:'Prairie',         value:116},
            {label:'Littoral',        value:117},
            {label:'Parc, jardin',    value:118},
            {label:'Jardin privé',    value:119},
            {label:'Rochers',         value:120},
            {label:'Bord de route',   value:121},
            {label:'Bord de l\'eau',  value:122},
          ],
        }
      ],
    };

    this.state = {
      help:{
        visible:false,
        'protocole':{
          title:'Protocole',
          content:' «Flash» Vous disposez de 20 minutes exactement pour photographier toutes les espèces se nourrissant de votre plante. L’insecte doit être posé sur la fleur. Notez l’heure à laquelle vous commencez l’observation.',
        },
      },

      loaded:false,
      collection:this.props.data,
      // {
      //   storage: this.props.data.storage,
      //   name: this.props.data.name,             // location:name   WTF !!
      //   protocole: this.props.data.protocole,
      //     // flash  name=smpAttr:21:464433 id=smpAttr:21:0  value=106
      //     // long        smpAttr:21:464433    smpAttr:21:1        107
        
      //   place:{
      //     long: this.props.data.place.long,     //  name=place:long  id=imp-sref-long
      //     lat: this.props.data.place.lat,       //  name=place:lat  imp-sref-lat
      //     name: this.props.data.place.name,     //
      //   },
        
      //   flower:{
      //     photo:'',
      //     id_flower_unknown:false,
      //     taxon_list_id_list:false,     // flower:taxa_taxon_list_id_list[]
      //     taxon_name:'',                // just for display on app.
      //     taxon_extra_info:'',
      //     comment:'',
      //   },

      //   environment:{
      //     photo:'',
      //     occAttr_3_1528533:false,      //  spontanée, plantée occAttr:3:1528533
      //     locAttr_2:'',                 //  ruche
      //     locAttr_1:[],                 //  habitat
      //     locAttr_3:false,              //  grande culture en fleur
      //   },
      // },
    };


    if(!this.state.collection.storage.path){
      this.storages = [];
      this.getAvailableStorages();
    }
  }

  componentDidMount(){  
    // Load data that are not part of list item.
    AsyncStorage.getItem(this.props.data.date+'_collection', (err, collection) => {
      if (err) {
        Alert.alert('ERROR getting collection ' + this.props.data.date+'_collection ... ' + JSON.stringify(err));
      }
      else {
        console.log('localStorage ' + this.props.data.date+'_collection', JSON.parse(collection));
        if(collection){
          this.setState({
            loaded:true,
            collection:JSON.parse(collection)
          }, function(){
            // this.props.flowerStatus(this.flowerStatus());
            this.props.valueChanged('status_flower', this.flowerStatus());
          });
        }
      }
    });
  }

  getAvailableStorages(){
    NativeModules.ioPan.getExternalStorages()
    .then((dirs) => {
      this.storages = JSON.parse(dirs);
      // console.log(this.storages);
      if(this.storages.length == 1){
        this.storeListItem('storage', this.storages[0]);
      }
    })
    .catch((err) => { 
      console.log('getExternalStorages', err) 
    })
  }

  storeCollection(commingf){
    AsyncStorage.setItem(this.props.data.date+'_collection', JSON.stringify( this.state.collection ));
    // this.props.flowerStatus(this.flowerStatus());
    this.props.valueChanged('status_flower',this.flowerStatus());
  }

  storeFlower(field, value){
    const flower = field=='id_flower_unknown' && value
    ? {
        ...this.state.collection.flower,
        id_flower_unknown:value,
        taxon_list_id_list:null,
        taxon_name:null,
        taxon_extra_info:null,
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
        this.storeCollection('flower');
      }
    );
  }
 
  storeEnvironment(field, value){
    console.log(this.state.collection)
    this.setState({
      collection:{
        ...this.state.collection,
        environment:{
          ...this.state.collection.environment,
          [field]:value,
        },
      },
    }, function(){
      this.storeCollection('env');
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
          taxon_name:picked.name,
        },
      },
    }, function(){
      this.storeCollection();
    })
  }

  showTaxonModal = () => {
    this.refs['flower-taxon-modal'].show();
  }

  // TODO: check we don't do this 2X.
  storeListItem(key, value){
    console.log(this.props)
        console.log(this.state);

    if(value){
      this.setState({collection:{...this.state.collection, 
          [key]:value,
        }}, function(){

          // Create Folder now we have storage (phone/sd).
          if(key=='storage'){
          
            const collectionName = this.props.data.date;

            RNFetchBlob.fs.mkdir(value.path +'/'+ collectionName)
            .then(() => { 
              // Created insects folder.
              RNFetchBlob.fs.mkdir(value.path +'/'+ collectionName  +'/insects')
              .then(() => { 
                //
              })
              .catch((err) => { 
                Alert.alert(
                  'Erreur',
                  'Le dossier de stockage des photos n\'a pu être créé.\n'
                  + value.path +'/'+ collectionName + '/insects'
                );
              })
            })
            .catch((err) => { 
              Alert.alert(
                'Erreur',
                'Le dossier de stockage des photos n\'a pu être créé.\n'
                + value.path +'/'+ collectionName
              );
            })
          }

          // Create default flash session.
          // if(key=='protocole' && value=='flash'){
          //   {
          //     date:'',
          //     time_start:'',
          //     time_end:'',
          //     smpAttr_24:'',
          //     smpAttr_25:'',
          //     smpAttr_26:'',
          //     shadow:'', 
          //   } 
          // }

          // Update list items.
          this.props.valueChanged(key, value);

          // Store on device.
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

  flowerStatus(){
    const envValid = checkForm(this.form.environment, this.state.collection.environment);
    const lieuValid = this.state.collection.place.lat && this.state.collection.place.long;
    const indentificationValid = this.state.collection.flower.id_flower_unknown 
                            ||  this.state.collection.flower.taxon_extra_info
                            ||  this.state.collection.flower.taxon_list_id_list;
    const photoValid = this.state.collection.flower.photo &&  this.state.collection.environment.photo;

    return photoValid && indentificationValid && lieuValid && envValid;
  }

  render () {
    if(!this.state.loaded){
      return <LoadingView/>;
    }

    const envValid = checkForm(this.form.environment, this.state.collection.environment);
    const lieuValid = this.state.collection.place.lat && this.state.collection.place.long;
    const indentificationValid = this.state.collection.flower.id_flower_unknown 
                            ||  this.state.collection.flower.taxon_extra_info
                            ||  this.state.collection.flower.taxon_list_id_list;

    return (
        
        <View style={{flex:1}}>
        { this.state.collection.storage.path
          ? null 
          : <View>
              <View 
                style={{flexDirection:'row', justifyContent:'center', marginTop:20,}}
                // onPress = {() => this.help('Protocole')} 
                >
                <Text style={{
                  fontSize:18, fontWeight:'bold',
                  padding:5, color:colors.greenFlash, backgroundColor:'transparent'}}>
                Stockage des photos</Text>
              </View>

              <View style={[styles.collection_grp, {flexDirection:'row'}]}>    
                { this.storages.map((value, index) =>
                  <TouchableOpacity 
                    key={index}
                    style={{ marginRight:5, padding:2,
                      flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center',
                      borderWidth:1, borderColor:this.state.collection.storage.type=='phone'?colors.greenFlash:'grey',
                    }}
                    onPress = {() => this.storeListItem('storage', value)} 
                    >
                    <MaterialCommunityIcons
                      name={ value.type=='phone' ? "cellphone-android" : "micro-sd" }
                      style={{
                        backgroundColor:'transparent',
                        color:this.state.collection.storage.path==value.path ? colors.greenFlash :'grey',
                      }}
                      size={25}
                    />
                    <Text style={{fontSize:16,
                      color:this.state.collection.storage.path==value.path ? colors.greenFlash : 'grey'
                      }}>
                    { value.type=='phone' ? "Téléphone" : "Carte SD" }</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }

          { this.state.collection.protocole 
          ? null
          : <View>
              <TouchableOpacity 
                style={{flexDirection:'row', justifyContent:'center', marginTop:20,}}
                onPress = {() => this.help('Protocole')} 
                >
                <Text style={{
                  fontSize:18, fontWeight:'bold',/* flex:1, textAlign:'center',*/ 
                  padding:5, color:colors.greenFlash, backgroundColor:'transparent'}}>
                PROTOCOLE</Text>
                <MaterialCommunityIcons
                  name="help-circle-outline" 
                  style={{color:colors.greenFlash, paddingTop:10, backgroundColor:'transparent'}}
                  size={15}
                  backgroundColor = 'transparent'
                />
              </TouchableOpacity>
  
              <View style={[styles.collection_grp, {flexDirection:'row'}]}>      
                <TouchableOpacity 
                  style={{ marginRight:5, padding:2,
                    flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center',
                    borderWidth:1, borderColor:this.state.collection.protocole=='flash'?colors.greenFlash:'grey',
                  }}
                  onPress = {() => this.storeListItem('protocole','flash')} 
                  >
                  <MaterialCommunityIcons
                    name="flash" 
                    style={{
                      backgroundColor:'transparent',
                      color:this.state.collection.protocole=='flash'?colors.greenFlash:'grey',
                    }}
                    size={25}
                  />
                  <Text style={{fontSize:16,
                    color:this.state.collection.protocole=='flash'?colors.greenFlash:'grey'
                    }}>
                  Flash</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ marginLeft:5, padding:2,
                    flexDirection:'row', flex:0.5, justifyContent:'center', alignItems:'center',
                    borderWidth:1, borderColor:this.state.collection.protocole=='long'?colors.greenFlash:'grey',
                    }}
                  onPress = {() => this.storeListItem('protocole','long')} 
                  >
                  <MaterialCommunityIcons
                    name="timer-sand" 
                    style={{
                      backgroundColor:'transparent',
                      color:this.state.collection.protocole=='long'?colors.greenFlash:'grey',
                    }}
                    size={25}
                  />
                  <Text style={{ fontSize:16,
                    color:this.state.collection.protocole=='long'?colors.greenFlash:'grey',
                    }}>
                  Long</Text>
                </TouchableOpacity>
              </View>
            </View>
          }

          { !this.state.collection.name || !this.state.collection.storage.path || !this.state.collection.protocole 
          ? <View style={{flex:1}}>
              <View style={{flex:1}}></View>
              <FooterImage/> 
            </View> 

          : // Flower.
            <ScrollView style={{flex:1}}>
              {/*
              <View style={styles.collSectionTitle}>
                <Text style={styles.collSectionTitleText}>
                Station Florale</Text>
              </View>
              */}
              <View style={{
                flexDirection:'row',
                marginTop:20,
                // flexDirection:'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                margin:15,
                }}>
                <ImagePicker 
                  // ref="collection-flower"
                  key="collection-flower"
                  cam={true}
                  title={'Fleur en\ngros plan'}
                  styles={{
                    highlightColor:colors.greenFlash,
                    badColor:colors.purple,
                    title:{fontSize:14, height:50, textAlign:'center',  padding:2},
                    container:{marginRight:5, flex:0.5, padding:5, borderWidth:1, borderColor:'lightgrey', backgroundColor:'white'}
                  }}

                  path={this.state.collection.storage.path + '/' + this.props.data.date + '/flower'}
                  filename={this.state.collection.flower.photo}
                  onSelect={(filename)=>{
                    this.storeFlower('photo', filename);
                    this.props.valueChanged('photo_flower',filename);
                  }}
                />

                <ImagePicker
                  // ref="collection-environment"
                  key="collection-environment"
                  title={'Fleur à 2-3 mètres\nde distance'}
                  cam={true}
                  styles={{
                    highlightColor:colors.greenFlash,
                    badColor:colors.purple,
                    title:{fontSize:14, height:50, textAlign:'center',  padding:2},
                    container:{marginRight:5, flex:0.5, padding:5, borderWidth:1, borderColor:'lightgrey', backgroundColor:'white'}
                  }}

                  path={this.state.collection.storage.path + '/' + this.props.data.date + '/environment'}
                  filename={this.state.collection.environment.photo}
                  onSelect={(filename)=>{
                    this.storeEnvironment('photo', filename);
                    this.props.valueChanged('photo_environment',filename);
                  }}
                />
              </View>

              <Text style={[styles.collSectionTitle, 
                indentificationValid?{}:{backgroundColor:colors.purple}]}>
              Identification</Text>

              <View style={styles.collection_grp}>

                {/* TODO ... one day maybe               
                <CheckBox
                                    textStyle={styles.collection_input_text}
                  checkedColor = {colors.greenFlash}
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
                      color: colors.greenFlash, padding:5,
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
                        <Text 
                          // numberOfLines={1}
                          style={{
                            flex:1,
                            padding:5,
                            fontSize:14,
                            backgroundColor:'white',
                            color:this.state.collection.flower.taxon_list_id_list?colors.greenFlash:'grey'
                            }}>
                          { this.state.collection.flower.taxon_list_id_list
                            ? this.state.collection.flower.taxon_name
                            : 'Je choisis dans la liste'
                          }
                        </Text>
                      </TouchableOpacity>      

                      <TextInput
                        placeholder='Je connais une dénomination plus précise'
                        placeholderTextColor='grey'
                        style={{padding:4, marginBottom:5, borderWidth:1, 
                          fontSize:14,
                          backgroundColor:'white',
                          color:colors.greenFlash,
                          borderColor:this.state.collection.flower.taxon_extra_info?colors.greenFlash:'lightgrey', }} 
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

              <Text style={[styles.collSectionTitle, 
                lieuValid?{}:{backgroundColor:colors.purple}]}>
              Lieu</Text>

              <View style={styles.collection_grp}>
                <LocationPicker
                  name={this.state.collection.place.name}
                  lat={this.state.collection.place.lat} 
                  long={this.state.collection.place.long}

                  locationChanged={(value) => this.storeListItem('place', value)}

                  styles={{
                    title:styles.coll_subtitle,
                    group:styles.collection_subgrp,
                    highlightColor:colors.greenFlash,
                    badColor:colors.purple,
                  }}

                />

              </View>

              <Text style={[styles.collSectionTitle,
                envValid?{}:{backgroundColor:colors.purple}]}>
              Environnement</Text>

              <View style={styles.collection_grp}>
                <Form
                  fields={this.form.environment}
                  currentValues={this.state.collection.environment}
                  fieldChanged={(field, value) => this.storeEnvironment(field, value)}
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

              <FooterImage/>
            </ScrollView>
          }
    
          <ModalFilterPicker
            ref={'flower-taxon-modal'}
            title='Taxon de la fleur'
            titleTextStyle={styles.titleTextStyle}
            highlightColor={colors.greenFlash}
            options={flowerList}
            onSelect={this.selectTaxon}
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

  collSectionTitle:{
    padding:5,
    marginTop:20,
    marginBottom:5,
    fontSize:16,
    fontWeight:'bold',
    textAlign:'center',
    color:'white', 
    backgroundColor:colors.greenFlash, 
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

  cam:{
    position:'absolute',
    top:0,
    bottom:0,
    left:0, 
    right:0,
  },

  // collection_input_text:{
  //   padding:5,
  //   marginLeft:15,
  //   marginRight:15,
  //   fontSize:18,
  //   textAlign:'center',
  //   backgroundColor:'white',
  //   borderColor:colors.greenFlash,
  //   borderWidth:1,
  // },
});
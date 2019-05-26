import React, { Component } from 'react';
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
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import FooterImage from './footerimage';
// import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';

import {
  ImagePicker,
  Form,
} from './widgets.js';
import { formatDate, formatTime, date2folderName} from './formatHelpers.js';

// Spipoll data.
import { insectList } from './insects.js';
import { criteria } from './criteres.js';
import { colors } from './colors';


//=========================================================================================
class TaxonModal extends Component {
//-----------------------------------------------------------------------------------------

  constructor(props) {
    super(props);

    this.state = {
      visible:false,
      curCrit_id:'1',
      curCrit:criteria['1'],
      selectedCrit_ids:[],
      remainings:insectList,

      remainingsCrit:[],
    }
    this.pastCrit=[];
    this.pastCrit_ids=[];
    this.pastCrit_valkey=[];
    this.pastCrit_valkey=[];
  }

  componentDidMount(){
    console.log(insectList);
    console.log(criteria);
    this.selectCrit(this.state.curCrit_id);
  }

  selectCrit(id){
    this.setState({
      curCrit_id:id,
      curCrit:criteria[id]
    });
  }


  addCrit(crit_val_id, crit_val_key){
alert(crit_val_id + ' ' +crit_val_key);

    this.pastCrit_ids.push(this.state.curCrit_id);
    this.pastCrit_valkey.push([crit_val_key]); // TODO: possible multi select

    this.pastCrit_valkey[this.state.curCrit_id] = [crit_val_key];// to check crits
    this.pastCrit[this.state.curCrit_id] = [crit_val_id];// to check insect//TODO: possible multi select


    // Get remainings insects (that fit all set crits).
    // ex: crit:[{cid:0,stat:[5,6,7,8]},
    //      {cid:1,stat:[13]},
    //      {cid:2,stat:[19]},
    //      {cid:68,stat:[272,273,274]},
    // if crit 68 is set, one of past crit values must be one of 272, 273, 274.

    // console.log('remainings insects');
    let remainings = [];
    insectList.forEach((i) => {
      let condOK = true;
      i.crit.forEach((ic) => {

        // console.log('crit '+ic.cid + ':' , criteria[''+ic.cid].name);
        // console.log(this.pastCrit_ids)

        if(this.pastCrit_ids.indexOf(''+ic.cid) != -1 ){
          // console.log();
          // Array intersection.
          const inter = ic.stat.filter(value => -1 !== this.pastCrit[ic.cid].indexOf(value));
          if(!inter.length){    
            condOK = false;
            // break;
          }
        }
        else{
           // console.log('no');
        }

      });
      if(condOK){
        remainings.push(i);
      }
    });


    // Get newly available criteria.


    let remainingsCrit = [];
    for (var key in criteria) {
      // Go on if that crit has already been set.
      if (!criteria.hasOwnProperty(key)
      || this.pastCrit_ids.indexOf(key)!=-1) continue;

      const cond = criteria[key].condition;
      console.log('crit name',criteria[key].name);
      console.log('crit cond',cond);
      // All conditions must be true ...
          // ex: condition = {'2':[0], '3':[0,2]},
          // crit 2 must be 0  AND  crit 3 must be 0 or 2
      let condOK = true;
      if(cond){
        for (var c in cond) {
          if (!cond.hasOwnProperty(c)) continue;

          // false if Condition has a crit that we haven't set yet.
          if(this.pastCrit_ids.indexOf(c) == -1) {
            condOK = false;
            break;
          }

          // false if (one or more) past crit do not fit condition.
          else {
            // Array intersection.
            const inter = cond[c].filter(value => -1 !== this.pastCrit_valkey[c].indexOf(value));
            if(!inter.length){    
              condOK = false;
              break;
            }
          }
        }        
      }
      if(condOK){
        remainingsCrit.push({...criteria[key], id:key});
      }

    }
    // TODO: remove crit that are not part of remaining insects.


    const selectedCrit_ids = this.state.selectedCrit_ids;
    selectedCrit_ids.push(crit_val_id);
    this.setState({
      curCrit_id:false,
      curCrit: false,
      selectedCrit_ids:selectedCrit_ids,
      remainings:remainings,
      remainingsCrit:remainingsCrit,
    });
  }


  show(){
    this.setState({visible:true});
  }

  hide(){
    this.setState({visible:false});
  }

  render(){
    console.log('render modal-taxon-search');
  
    console.log('this.state.curCrit_id',this.state.curCrit_id)
    console.log('this.state.curCrit', this.state.curCrit);
    // console.log(Object.entries(this.state.curCrit.values));

    return (
   <Modal
        onRequestClose={() => this.hide()}
        visible={this.state.visible}
        >

          <View 
            style={{
              height:55, flexDirection:'row', 
              justifyContent:'center', alignItems:'center',
              backgroundColor:colors.greenFlash,
              }}
            >
            <TouchableOpacity 
              style={[{
                height:55,
                width:55,
                justifyContent:'center', alignItems:'center', 
                borderRightWidth:1, borderRightColor:'white', 
              }]}
              onPress={() =>  this.hide()}
              >
              <MaterialCommunityIcons
                name="chevron-left" 
                style={[{ color:'white' }]}
                size={30}
              />
            </TouchableOpacity>

            <View 
              // <ScrollView horizontal={true} style={{marginLeft:10, marginRight:10}}>
              style={{flex:1,
               alignItems:'center', justifyContent:'center',
              }}>
              <Text style={{
                fontSize:18, fontWeight:'bold', textAlign:'center', 
                color:'white', 
              }}>
               Reste: {this.state.remainings.length}</Text>
            </View>
          </View>
          

          <View // Photo to be indetified.
            // TODO zoomable.
            style={{flexDirection:'row'}}>
            <Image 
              source={this.props.source}
              resizeMode="contain"
              style={{
                width: Dimensions.get('window').width/2, 
                height: Dimensions.get('window').width/2 }}
            />

            <View 
              // remainigs insects.
              >
            </View>
          </View>

          { this.pastCrit_ids.length <1 ? null :
          <View
            // Past selected criteria.
            style={{}}
            >
            <Text style={{
              color:'white',
              backgroundColor:colors.greenFlash,
              fontWeight:'bold', fontSize:16,
              color:'white', textAlign:'center', padding:5
              }}>
              Historique
            </Text>

            { this.pastCrit_ids.map((value, key)=>
              <View key={key}
                style={{paddingLeft:10,paddingRight:10,paddingTop:5}}
                >
                <Text style={{fontWeight:'bold'}}>
                  {criteria[value].name + ' '} 
                  <Text style={{fontWeight:'normal'}}>
                    {criteria[value].values[this.pastCrit_valkey[key]].name}
                  </Text>
                </Text>
              </View>           
            )}
          </View>
          }

          { // Current criteria description.
            this.state.curCrit !== false
            ? <View style={{flexDirection:'row', backgroundColor:colors.greenFlash}}>
                <Image
                  source={{uri:'asset:/img/criteres/pictos/'
                    + this.state.curCrit_id + '.png'}}
                  style={{
                    width: Dimensions.get('window').width/4,
                    height: Dimensions.get('window').width/4 }} 
                  resizeMode="contain"
                />
                <View style={{flex:1, paddingRight:15, }}>
                  <Text style={{
                    color:'white',
                    // textAlign:'center',
                    fontWeight:'bold', 
                    fontSize:16,
                    }}>
                    {this.state.curCrit.name + ' '}
                    <Text 
                      style={{
                        fontSize:14,
                        fontWeight:'normal', 
                        color:'white',
                      }}>
                      {this.state.curCrit.detail}
                      </Text>
                  </Text>


                </View>
              </View>

            : <View>
                <Text style={{
                  padding:5,
                  backgroundColor:colors.greenFlash,
                  color:'white',
                  textAlign:'center',
                  fontWeight:'bold', 
                  fontSize:16,
                  }}>
                  Sélectionnez un critère:
                  </Text>
              </View>
            }


          <ScrollView horizontal style={{flex:1}}>

            { !this.state.curCrit
              ? // Choose a criteria.
                this.state.remainingsCrit.map((value, key)=>{
                  return (
                    <TouchableOpacity 
                      key={key}
                      style={{
                        width:100, alignItems:'center',
                        borderRightWidth:1, borderRightColor:'white',
                      }}
                      onPress={()=> this.selectCrit(value.id)}
                      >
                      <Image
                        source={{uri:'asset:/img/'
                          +'criteres/pictos/'
                          + value.id
                          +'.png'}}
                        style={{width:100, height:100,
                        backgroundColor:colors.greenFlash}} 
                        resizeMode="contain"
                      />
                      <Text style={{fontWeight:'bold',textAlign:'center'}}>
                      {value.id}
                      </Text>

                      <Text style={{fontWeight:'bold',textAlign:'center'}}>
                      {value.name}
                      </Text>
                      <Text>
                      {value.detail}
                      </Text>
                    </TouchableOpacity>
                  );
                })

              : // Criteria choosen => output criteria values.
                Object.entries(this.state.curCrit.values).map((value, key) => {
                // this.state.curCrit.values((value, index) => {

                  value=value[1];
                  // console.log(key)
                  // console.log(value)

                  return (
                    <TouchableOpacity 
                      key={key}
                      style={{
                        width:100, alignItems:'center',
                        borderRightWidth:1, borderRightColor:'white',
                      }}
                      onPress={()=>this.addCrit(value.id, key)}
                      >
                      <Image
                        source={{uri:'asset:/img/'
                          +'criteres/pictos/'
                          +this.state.curCrit_id
                          +'-'
                          + key //value.id
                          +'.png'}}
                        style={{width:100, height:100, backgroundColor:colors.greenFlash}} 
                        resizeMode="contain"
                      />
                      <Text style={{fontWeight:'bold',textAlign:'center'}}>
                      {value.name}
                      </Text>
                      <Text>
                      {value.detail}
                      </Text>
                    </TouchableOpacity>
                  );
                 
              })}

          </ScrollView>
 
      </Modal>
    );
  }
}


//-----------------------------------------------------------------------------------------
export default class InsectForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx);

// TODO: occAttr_4 read only if not null.

    this.form = {insect:[
      {
        name:'occAttr_5',
        type:'singleSelect',
        title:'Insecte photographié sur la fleur de votre station florale',
        // Avez-vous photographié cet insecte AILLEURS que sur la fleur de votre station florale:
        values: [ 
          {label:'Oui', value:0},   // Question inversée ...
          {label:'Non', value:1},   // ... pour plus de clareté.
        ],
        helper:true,
      },{
        name:'occAttr_4',
        type:'singleSelect',
        title:'Nombre maximum d\'individus de cette espèce vus simultanément',
        values: [ 
          {label:' 1 ',           value:123},
          {label:'entre 2 et 5',  value:124},
          {label:'plus de 5',     value:125},
          {label:'Ne sais pas',   value:126},
        ],
      },
      // TODO: SelectList session id. gonna be tricky to send to spipoll.

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
        //   taxon_name:value.name,
        // },
        // visibleTaxonModal: false,
      },function(){
        // Update list. ... TODO: multival
        this.props.valueChanged('taxon_list_id_list', value.value);
        this.props.valueChanged('taxon_name', value.name);
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

  render(){
    console.log('render InsectForm', this.state);
    return(
        <ScrollView style={{flex:1}}>

              <View style={styles.collection_grp}>
                <ImagePicker
                  key="collection-insect"
                  title={this.state.insect.taxon_extra_info || this.state.insect.taxon_name || 'Non identifiée' }
                  cam = {false}
                  extractPhotos={(paths, selectedImageMoved) => this.props.extractPhotos(paths, this.state.insect.session, selectedImageMoved)}
                  styles={{
                    highlightColor:colors.greenFlash,
                    badColor:colors.purple,
                    title:{fontSize:14, height:50, textAlign:'center',  padding:2},
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
                  onPress={() => this.refs['modal-insect-list'].show()}
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

                <TouchableOpacity 
                  style={{
                    marginBottom:10,
                    padding:1,
                    flexDirection:'row',
                    backgroundColor:'white', borderColor:'lightgrey', borderWidth:1}}
                    onPress={()=>this.refs['modal-taxon-search'].show()}
                  >
                  <View
                    style={{ justifyContent:'center', alignItems:'center',
                      backgroundColor:colors.greenFlash,
                       padding:5, marginRight:5,
                      }}
                    >
                    <MaterialCommunityIcons
                      name="bug" //table-search 
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
                      : "Outil d'ident." 
                    }
                  </Text>
                </TouchableOpacity>  
                <TaxonModal 
                  ref={"modal-taxon-search"}
                  source= {{uri:'file://'
                      +this.props.collection_storage + '/insects/'
                      + this.props.data.date 
                      + '/' + this.state.insect.photo}}
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
   
                { !this.state.insect.session ? null :
                  <View
                    style={styles.collection_subgrp}
                    >
                    <Text style={{fontSize:14}}>
                      Session: 
                      {formatDate(parseInt(this.state.insect.session.split('_')[0]))}
                      {formatTime(parseInt(this.state.insect.session.split('_')[1]),10)}
                    </Text>
                  </View>
                }

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
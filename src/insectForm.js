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
  FlatList,
  AsyncStorage,
  Modal,
  BackHandler,
  NetInfo,
  CheckBox,
  NativeModules,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS  from'react-native-fs';
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
      curCrit_id:false,
      curCrit:false,
      selectedCrit_ids:[],
      remainings:insectList,

      remainingsCrit:[],
    }
    this.pastCrit=[];
    this.pastCrit_ids=[];
    this.pastCrit_valkey={};
    // this.pastCrit_valkey=[];
  }

  componentDidMount(){
    this.selectCrit('1');
  }


  async selectCrit(id){
    console.log('selectCrit', id);
         // Get current criteria photos.

          //    /img/criteres/photos/750/etat_750_01&1376208047518
          // this.critPhotos[key]= this.getCriteriaPhoto(key);
          const files = await RNFS.readDirAssets('img/criteres/photos/' + criteria[id].photo_etat);
          files.sort();
          const critPhotos = {};
          files.forEach((f)=>{
            if(f.isFile){
              // Get crit values.
              let sub = f.name.substring(0,11).split('_');
              sub = ''+(parseInt(sub[2],10)-1); // remove leading 0.
              if(typeof critPhotos[sub] == 'undefined'){
               critPhotos[sub] = [];
              }
             critPhotos[sub].push(f.path);
            }
                    //             {
                    //   name: string;     // The name of the item
                    //   path: string;     // The absolute path to the item
                    //   size: string;     // Size in bytes.
                    //               // Note that the size of files compressed during the creation of the APK (such as JSON files) cannot be determined.
                    //               // `size` will be set to -1 in this case.
                    //   isFile: () => boolean;        // Is the file just a file?
                    //   isDirectory: () => boolean;   // Is the file a directory?
                    // };
          });
      

    this.setState({
      curCrit_id:id,
      curCrit:{...criteria[id],
        photos:critPhotos,
      },
    });
  }


  async addCrit(crit_val_id, crit_val_key) {

    this.critPhotos = {};
    this.pastCrit_ids.push(this.state.curCrit_id);
    // this.pastCrit_valkey.push([crit_val_key]); // TODO: possible multi select

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
    const insectRemainingCrit={};
    for (const i of insectList) {
      
      let condOK = true;
      for (const ic of i.crit) {

        // console.log('crit '+ic.cid + ':' , criteria[''+ic.cid].name);
        // console.log(this.pastCrit_ids)

        if(this.pastCrit_ids.indexOf(''+ic.cid) != -1 ){
          // Array intersection.
          const inter = ic.stat.filter(value => -1 !== this.pastCrit[ic.cid].indexOf(value));
          if(!inter.length){    
            condOK = false;
            break;
          }
        }
        else{ // Other crit available. Keep it for later.
          insectRemainingCrit[ic.cid] = true;
        }

      };

      if(condOK){
       // Get insect  photos.
       const photos = [];
       let firstPhoto = false;
        // /img/taxons_photos/[id]/taxon_04800&....
        // this.critPhotos[key]= this.getCriteriaPhoto(key);
        const files = await RNFS.readDirAssets('img/taxons_photos/' + i.id);
        files.sort();
        files.forEach((f)=>{
          if(f.isFile){
            if(f.path.indexOf('_01')){
              firstPhoto = f.path;
            }
            else{
              photos.push(f.path);
            }
          }
        });
        if(firstPhoto){
          photos.unshift(firstPhoto);
        }

        i.photos=photos;
        remainings.push(i);
      }
    };
    // console.log(remainings);

    // Get newly available criteria.
    let remainingsCrit = [];
    for (var key in criteria) {
      // Go on if that crit has already been set.
      if (!criteria.hasOwnProperty(key)
      || this.pastCrit_ids.indexOf(key)!=-1) continue;

      const cond = criteria[key].condition;
      console.log('crit name',criteria[key]);
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
        // Keep crit only if present in remaining insects.
        if(insectRemainingCrit[key]){
          remainingsCrit.push({...criteria[key], id:key});       
        }
      }
    }

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
          
          <ScrollView>
            <View style={{flexDirection:'row'}}>
              <Image 
                // Photo to be indentified.
                // TODO zoomable & slidable.
                source={this.props.source}
                resizeMode="contain"
                style={{
                  width: Dimensions.get('window').width/2, 
                  height: Dimensions.get('window').width/2 }}
              />

              <FlatList
                horizontal
                keyExtractor ={(item, index) => ''+item.value}
                data={this.state.remainings}
                
                renderItem={(row)=>{
                  const value = row.item;
                  return(
                    <View 
                      key={value.id} 
                      style={{
                          width:150
                    }}>

                      { // Insect photo sample.
                        // TODO: zoom.
                        !value.photos 
                        ? null 
                        : value.photos.map((path, pathindex)=>{
                          if(this.state.remainings.length>10){
                            if(pathindex==0){
                              return(
                                <Image
                                  key={pathindex}
                                  source={{uri:'asset:/'+path}}
                                  style={{width:150, height:150, backgroundColor:colors.greenFlash}} 
                                  resizeMode="contain"
                                /> 
                              );
                            }
                          }
                          else{
                            return(
                                <Image
                                  key={pathindex}
                                  source={{uri:'asset:/'+path}}
                                  style={{width:100, height:100, backgroundColor:colors.greenFlash}} 
                                  resizeMode="contain"
                                /> 
                            );
                          }

                        })
                      }
                    
                      <Text style={{textAlign:'center'}}>
                        {value.name} 
                        {/*<Text style={{fontWeight:'normal'}}>
                          {value.label} {value.id}
                        </Text>*/}
                      </Text>

                      </View>
                  );
                }}
              />


          </View>

          { // Past selected criteria.
          this.pastCrit_ids.length <1 ? null :
          <View
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

            { this.pastCrit_ids.map((value, key)=>{
              // console.log(key);
              // console.log(criteria[value].name);
              // console.log(criteria[value].values);

              // console.log(this.pastCrit_valkey);
              // console.log(criteria[value].values[this.pastCrit_valkey[key]])
              return(
                <View key={key}
                  style={{paddingLeft:10,paddingRight:10,paddingTop:5}}
                  >
                  <Text style={{fontWeight:'bold', minHeight:50,}}>
                    {criteria[value].name + ' '} 
                    <Text style={{fontWeight:'normal'}}>
                      {/*criteria[value].values[this.pastCrit_valkey[key]].name*/}
                    </Text>
                  </Text>
                </View>
              );

              }    
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

                  // TODO: don't compute colWidth for each item.
                  const colWidth = this.state.remainingsCrit.length < 3
                    ? Dimensions.get('window').width/2
                    : Dimensions.get('window').width/2.5;

                  return (
                    <TouchableOpacity 
                      key={key}
                      style={{
                        width:colWidth, alignItems:'center', marginRight:1,
                        // borderRightWidth:1, borderRightColor:'white',
                      }}
                      onPress={()=> this.selectCrit(value.id)}
                      >
                      <View style={{alignItems:'center', width:colWidth, backgroundColor:colors.greenFlash }}>
                      <Image
                        source={{uri:'asset:/img/'
                          +'criteres/pictos/'
                          + value.id
                          +'.png'}}
                        style={{width:100, height:100,
                        backgroundColor:colors.greenFlash}} 
                        resizeMode="contain"
                      />
                      </View>

                      <Text style={{fontWeight:'bold',textAlign:'center', marginBottom:10,}}>
                      {value.name}
                      </Text>
                      <Text style={{fontWeight:'normal',textAlign:'center'}}>
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
                  // console.log(this.state.curCrit.photos);
                       
                  const colWidth = Object.keys(this.state.curCrit.values).length < 3
                              ? Dimensions.get('window').width/2
                              : Dimensions.get('window').width/2.5;

                  return (
                  
                    <TouchableOpacity 
                      key={key}
                      style={{
                       width:colWidth, alignItems:'center', marginRight:1,
                        // borderRightWidth:2, borderRightColor:'white',
                      }}
                      onPress={()=>this.addCrit(value.id, key)}
                      >
                      
                      <View style={{alignItems:'center', width:colWidth, backgroundColor:colors.greenFlash }}>
                      <Image
                        source={{uri:'asset:/img/'
                          +'criteres/pictos/'
                          +this.state.curCrit_id
                          +'-'
                          + key //value.id
                          +'.png'}}
                        style={{width:100, height:100, backgroundColor:colors.greenFlash}} 
                        // resizeMode="contain"
                      />
                      </View>
                      <Text style={{minHeight:50,fontWeight:'bold',textAlign:'center'}}>
                      {value.name} 
                      </Text>
                      <Text>
                        {value.detail}
                      </Text>

                      { // Criteria value photo sample.
                        // TODO: zoom.
                        this.state.curCrit.photos[key].map((path, pathindex)=>
                          <Image
                            key={pathindex}
                            source={{uri:'asset:/'+path}}
                            style={{
                              marginHeight:10, 
                              width:colWidth, 
                              height:colWidth, 
                              backgroundColor:colors.greenFlash,
                            }} 
                            resizeMode="contain"
                          /> 
                        )
                      }  

                      
                    </TouchableOpacity>
                  );
                 
              })}

          </ScrollView>
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
                <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                <ImagePicker
                  key="collection-insect"
                  title={this.state.insect.taxon_extra_info || this.state.insect.taxon_name || 'Non identifiée' }
                  cam = {false}
                  extractPhotos={(paths, selectedImageMoved) => this.props.extractPhotos(paths, this.state.insect.session, selectedImageMoved)}
                  styles={{
                    highlightColor:colors.greenFlash,
                    badColor:colors.purple,
                    title:{fontSize:14, height:50, textAlign:'center',  padding:2},
                    container:{marginRight:5, flex:0.75, padding:5, borderWidth:1, borderColor:'lightgrey', backgroundColor:'white'}
                  }}

                  path={this.props.collection_storage + '/insects/' + this.props.data.date }
                  filename={this.state.insect.photo}
                  onSelect={(filename)=>this.storeInsect('photo', filename)}
                />
                </View>
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
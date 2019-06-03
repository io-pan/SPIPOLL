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
import ModalFilterPicker from './filterSelect';

import RNFetchBlob from 'rn-fetch-blob';
import ImageViewer from 'react-native-image-zoom-viewer';

import {
  ImagePicker,
  Form,
} from './widgets.js';
import { formatDate, formatTime, date2folderName} from './formatHelpers.js';

// Spipoll data.
import { insectList } from './insects.js';
import { criteria } from './criteres.js';
import { colors } from './colors';

const screenWidth = Dimensions.get('window').width,
      screenHeight = Dimensions.get('window').height;
//=========================================================================================
class TaxonModal extends Component {
//-----------------------------------------------------------------------------------------

  constructor(props) {
    super(props);

    this.state = {
      detailsVisible:false,
      historyVisible:false,
      currentCriteriaDescriptionVisible:false,
      remainingsThumbsVisible:false,


      sources:false, // photos of insect to be indentified.
      curCrit_id:false,
      curCrit:false,
      curCritSelectedKeys:[],
      curCritSelectedIds:[],
      remainings:insectList,
      remainingsCrit:[],
      remainingInsectPhotos:[],
    }

    this.pastCrit_ids=[];
    this.pastCrit={};
    this.pastCrit_valkey={};
    // this.pastCrit_valkey=[];
  }

  componentDidMount(){
    this.selectCrit('1');

 
    RNFetchBlob.fs.ls(this.props.sourcesPath)
    .then((files) => {
      if(files.length){
        files.sort();

        const sources = [];
        files.forEach((filename)=> {
          sources.push({ url:'file://' + this.props.sourcesPath +'/'+ filename });
        });
        this.setState({ sources:sources });
      }

    });      
  }

  selectCrit(id){
    this.setState({
      curCrit_id:id,
      curCrit:{...criteria[id],
        // photos:critPhotos,
      },
    }, function(){
        if(!this.state.curCrit.photos){
          this.loadRCritPhotos(id);
        }
    });
  }

  filterInsects(){
    // Get remainings insects (that fit all set crits).
    // ex: insectCrit:[ {cid:0,stat:[5,6,7,8]},
    //            {cid:1,stat:[13]},
    //            {cid:2,stat:[19]},
    //            {cid:68,stat:[272,273,274]} ]
    // if crit 68 is set, one of past crit values must be one of 272, 273, 274.


    // Test passed for Insect name:"Le Ramoneur", id: 473, 
    // crit 64:avec ou sans tache. Si tache 65 blanche

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
        remainings.push(i);
      }
    };
    // console.log(remainings);
    return {
      insects:remainings,
      criteria:insectRemainingCrit,
    }
  }

  filterCiteria(insectsCriteria){
    const remainingsCrit = [];
    for (var key in criteria) {
      // Go on if that crit has already been set.
      if (!criteria.hasOwnProperty(key)
      || this.pastCrit_ids.indexOf(key) !=-1 ) continue;

      const cond = criteria[key].condition;
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
        // TODO: ? 
        // . Keep only values present in remaining insects.
        // . Exclude criteria present in all remaining insects with all same value.
        //  (ex: all remaining insects have thorax blue => remove crit thorax color)
        if(insectsCriteria && insectsCriteria[key]){
          remainingsCrit.push({...criteria[key], id:key});       
        }
      }
    }
    return remainingsCrit;
  }


  addCurCritValue(crit_val_id, crit_val_key){
    const curCritSelectedKeys = this.state.curCritSelectedKeys,
          curCritSelectedIds = this.state.curCritSelectedIds,
          pos = curCritSelectedIds.indexOf(crit_val_id);
    

    if(pos != -1){
      curCritSelectedIds.splice(pos, 1);
      curCritSelectedKeys.splice(pos, 1);
    }
    else{
      curCritSelectedKeys.push(crit_val_key);
      curCritSelectedIds.push(crit_val_id);
    }
    this.setState({
      curCritSelectedKeys: curCritSelectedKeys,
      curCritSelectedIds: curCritSelectedIds,
    })
  }

  setCriteria(crit_val_id, crit_val_key) {
    // console.log([crit_val_id]) 
    //  console.log([crit_val_key])
    // console.log( Object.key(this.state.curCritSelectedKeys));
    // console.log( Object.values(this.state.curCritSelectedKeys));
    this.pastCrit_ids.push(this.state.curCrit_id);
    this.pastCrit[this.state.curCrit_id] = this.state.curCritSelectedIds; //// to check insect //TODO: possible multi select
    this.pastCrit_valkey[this.state.curCrit_id] = this.state.curCritSelectedKeys;// to check crits

    const remainings = this.filterInsects(),
          remainingsCrit = this.filterCiteria(remainings.criteria);

    this.setState({
      curCritSelectedKeys:[],
      curCritSelectedIds:[],
      currentCriteriaDescriptionVisible:false,
      curCrit_id:false,
      curCrit: false,
      remainings:remainings.insects,
      remainingsCrit:remainingsCrit,
    }, function(){
      if(remainings.insects.length && this.refs['remaining-insects']){
        this.refs['remaining-insects'].scrollToIndex({'index':0});
      }
    });
  }

  async loadRemainingInsectPhotos(id){
    console.log('loading' + 'img/taxons_photos/' + id)
    const photos = [];
    let firstPhoto = false;
      
    const files = await RNFS.readDirAssets('img/taxons_photos/' + id);
    files.sort();
    files.forEach((f)=>{
      if(f.isFile){
        if(f.path.indexOf('_01') != -1){
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

    this.setState({
      upd:new Date().getTime(),
      remainingInsectPhotos:{
        ...this.state.remainingInsectPhotos,
        [id]: photos
    }});
  }

  async loadRCritPhotos(id){
 
    // Get current criteria photos.
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
              // {
              //   name: string;     // The name of the item
              //   path: string;     // The absolute path to the item
              //   size: string;     // Size in bytes.
              //               // Note that the size of files compressed during the creation of the APK (such as JSON files) cannot be determined.
              //               // `size` will be set to -1 in this case.
              //   isFile: () => boolean;        // Is the file just a file?
              //   isDirectory: () => boolean;   // Is the file a directory?
              // };
    });
      
    criteria[id].photos=critPhotos;
    this.setState({
      curCrit:{
        ...this.state.curCrit,
        photos:critPhotos
    }});
  }


  toggleRemainingsThumbs(){
    this.setState({remainingsThumbsVisible:!this.state.remainingsThumbsVisible});
  }

  toggleCurrentCriteriaDetails(){
    console.log(this.state.currentCriteriaDescriptionVisible);
    this.setState({currentCriteriaDescriptionVisible:!this.state.currentCriteriaDescriptionVisible});
  }

  toggleHistory(){
    this.setState({historyVisible:!this.state.historyVisible});
  }

  deleteHistory(key, value){
    for(var i=key; i<this.pastCrit_ids.length;i++){
      delete this.pastCrit[this.pastCrit_ids[i]];
      delete this.pastCrit_valkey[this.pastCrit_ids[i]];
    }
    this.pastCrit_ids.splice(key);

    // Compute remainings insects & criteria.
    const remainings = this.filterInsects(),
          remainingsCrit = this.filterCiteria(remainings.criteria);

    this.setState({
      historyVisible:false,
      remainings:remainings.insects,
      remainingsCrit:remainingsCrit,
    }, function(){
      this.selectCrit(value);
    });
  }

  showDetailsModal(taxonId, listIndex){
    console.log(taxonId)
      console.log(listIndex)
    this.setState({ detailsVisible:listIndex }, function(){
      console.log( this.state.detailsVisible);
      // TODO !!! or make own slider :((
      //  console.log('showDetailsModal',this.state.detailsVisible) 
      // this.scrollDetailsToIndex();
    });
  }

  closeDetailsModal(){
    this.setState({ detailsVisible:false });
  }

  renderDetailsModal(){
    const item = this.state.remainings[this.state.detailsVisible];

    if(!this.state.remainingInsectPhotos[item.id]){
      this.loadRemainingInsectPhotos(item.id);
    }

    return(
      <Modal
        ref={'remaining-insects-modal'}
        visible={this.state.detailsVisible!==false}
        onRequestClose={() => this.closeDetailsModal()}
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
            onPress={() => this.closeDetailsModal()}
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
            Fiche Détaillée
            </Text>
          </View>
        </View>

        <ScrollView>
          <Text style={{
            fontSize:18, fontWeight:'bold', textAlign:'center', 
            // color:'white', 
          }}>
          { item.name}
          </Text>
          <Text style={{
            fontSize:18, fontWeight:'normal', textAlign:'center', 
            // color:'white', 
          }}>
          { item.label}
          </Text>

          { this.state.remainingInsectPhotos[item.id]
            ? this.state.remainingInsectPhotos[item.id].map((path, pathindex)=>
                <Image
                  key={pathindex}
                  source={{uri:'asset:/'+path}}
                  style={{width:screenWidth, height:screenWidth, backgroundColor:colors.greenFlash}} 
                  resizeMode="contain"
                /> 
              )
            : <Text> CHARGEMENT PAS D'IMAGE </Text>
          }
        </ScrollView>
      </Modal>
    );
  }

                   
  setThumbTitleHeight(e){
    console.log(e)
    this.setState({
      thumbTitleHeight:e.nativeEvent.layout.height,
    });
  }  
         

  render(){
    const 
      critColWidth =  this.state.curCrit
                          && Object.keys(this.state.curCrit.values).length < 3
                          ? screenWidth/2
                          : screenWidth/2.2,
      critChoiceColWidth =  this.state.remainingsCrit
                            && this.state.remainingsCrit.length < 3
                            ? screenWidth/2
                            : screenWidth/2.2,

      remainingsColWidth =  this.state.remainings
                            && this.state.remainings.length < 3
                            ? screenWidth/2
                            : screenWidth/2.2;
    return (
      this.state.detailsVisible !== false
      ? this.renderDetailsModal()
      :
      <Modal
        onRequestClose={() => this.props.close()}
        visible={true}
        >
          <View style={{ flex:1}} >
          { this.pastCrit_ids.length && this.state.historyVisible
          
          ? // History
            <View style={{flex:1}}>
              <View 
                style={{
                  height:55,
                  flexDirection:'row',
                  marginBottom:10,
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
                  onPress={() => this.toggleHistory()}
                  >
                  <MaterialCommunityIcons
                    name="chevron-left" 
                    style={[{ color:'white' }]}
                    size={30}
                  />
                </TouchableOpacity>

                <Text style={{ 
                  flex:1,
                  color:'white',
                  textAlign:'center',
                  fontWeight:'bold', 
                  fontSize:18,
                  }}>
                  Historique
                </Text>
              </View>

              { this.pastCrit_ids.map((value, key)=>     
                <TouchableOpacity 
                  key={key}
                  style={{padding:10,
                    borderBottomWidth:1, borderBottomColor:'lightgrey'}}
                  onPress={()=> this.deleteHistory(key, value)}
                  >
                  <Text style={{fontSize:16, fontWeight:'bold'}}>
                    {criteria[value].name + ' '} 
                  </Text>
                  { // loop selected values.
                      this.pastCrit_valkey[value].map((v,k)=>
                        <Text key={k} style={{fontWeight:'normal', marginTop:5,}}>
                        <Text style={{fontWeight:'bold'}}>{k+1}) </Text>
                        { criteria[value].values[v].name }</Text>
                      )
                    }
                </TouchableOpacity>
              )}
            </View>
          : // Indentifiction tool.
            <View style={{flex:1}}>

              { // Photo(s) to be indentified.
                !this.state.sources ? null :
                <ImageViewer
                  backgroundColor={'black'}
                  style={{flex:0.45, backgroundColor:'black',
                        // width: screenWidth*2/3, 
                        // height: screenWidth*2/3
                      }}
                  imageUrls={this.state.sources}
                  enablePreload={true}
                  renderIndicator ={()=> null}
                  saveToLocalByLongPress={false}
                  renderHeader={(currentIndex) => null}
                  renderFooter={() => null}
                  />
              }

              <View style={{flex:0.55}}>

                <View 
                  style={{
                    height:50, flexDirection:'row',
                    marginBottom:1,
                    justifyContent:'center', alignItems:'center',
                    backgroundColor:colors.greenFlash,
                    }}
                  >
                  { // History button
                  this.pastCrit_ids.length < 1 ? null :
                    <TouchableOpacity 
                      style={[{
                        height:50,
                        width:55,
                        justifyContent:'center', alignItems:'center', 
                        borderRightWidth:1, borderRightColor:'white', 
                      }]}
                      onPress={() => this.toggleHistory()}
                      >
                      <MaterialCommunityIcons
                        name="undo-variant" 
                        style={[{ color:'white' }]}
                        size={30}
                      />
                    </TouchableOpacity>
                  }

                  <TouchableOpacity 
                    style={{flex:1, flexDirection:'row', height:50, backgroundColor:colors.greenFlash,
                     alignItems:'center', justifyContent:'center',
                    }}
                    onPress={() => this.toggleRemainingsThumbs()}
                    >
                    <Text style={{
                      flex:1,
                      color:'white',
                      textAlign:'center',
                      fontWeight:'bold', 
                      fontSize:16,
                      }}>
                      {this.state.remainings.length} taxons restants

                    </Text>

                      <MaterialCommunityIcons
                        name={this.state.remainingsThumbsVisible?"chevron-up":"chevron-down"}
                        style={{ width:55, color:'white', paddingLeft:10,}}
                        size={30}
                      />
                  </TouchableOpacity>
                </View>

              { this.state.remainingsThumbsVisible ?
              <FlatList
                // Remaining Insects.
                ref={'remaining-insects'}
                horizontal
                style={{flex:1,}}
                keyExtractor ={(item, index) => ''+item.value}
                data={this.state.remainings}
                extraData={this.state.remainingInsectPhotos}
                renderItem={(row)=>{                
                  const value = row.item;
                  if(!this.state.remainingInsectPhotos[value.id]){
                    this.loadRemainingInsectPhotos(value.id);
                    return(
                      <View 
                        key={value.id} 
                        style={{
                            width:remainingsColWidth,
                            paddingBottom:10,
                      }}>
                        <Text style={{textAlign:'center', padding:2}}>
                          {value.name} 
                        </Text>
                      </View>
                    );
                  }
                  else{
                    return(
                      <ScrollView key={value.id} >
                      <TouchableOpacity // Remaining insects photo samples.
                        style={{width:remainingsColWidth, paddingBottom:10}}
                        onPress={()=>this.showDetailsModal( row.item.id, row.index)}
                        >

                        { this.state.remainings.length < 10
                        ? <View>
                          <Text 
                            style={{textAlign:'center', marginTop:10, marginBottom:10}}>
                            {value.name} 
                          </Text>
                          {this.state.remainingInsectPhotos[value.id].map((path, pathindex)=>
                              <Image
                                key={pathindex}
                                source={{uri:'asset:/' + path}}
                                style={{width:remainingsColWidth, height:remainingsColWidth, backgroundColor:colors.greenFlash}} 
                                resizeMode="contain"
                              />
                            )}
                          </View>
                        : <View><Image 
                              source={{uri:'asset:/' + this.state.remainingInsectPhotos[value.id][0]}}
                              style={{width:remainingsColWidth, height:remainingsColWidth, backgroundColor:colors.greenFlash}} 
                              resizeMode="contain"
                            /> 
                          <Text 
                            style={{textAlign:'center', paddingTop:10, paddingBottom:10}}>
                            {value.name} 
                          </Text>
                          </View>
                        }
                      </TouchableOpacity>
                      </ScrollView>
                    );
                  }
                }}
              />
        
              :
               // Current criteria.
              this.state.curCrit !== false
              ? <View style={{flex:1}}>
                  <View style={{flexDirection:'row'}}>
                    <TouchableOpacity
                      style={{flex:1,backgroundColor:colors.greenFlash, marginBottom:0,}}
                      onPress = {() => this.toggleCurrentCriteriaDetails()} 
                      >
                      {/*
                      <Image
                        source={{uri:'asset:/img/criteres/pictos/'
                          + this.state.curCrit_id + '.png'}}
                        style={{
                          width: screenWidth/4,
                          height: screenWidth/4 }} 
                        resizeMode="contain"
                      />
                      */}
                      <Text // Current criteria name.
                        style={{
                          color:'white',
                          textAlign:'center',
                          fontWeight:'normal',//bold', 
                          fontSize:16,
                          padding:10, 
                        }}
                        >

                        {this.state.curCrit.name + ' '}

                        { !this.state.curCrit.detail ? null :
                          <MaterialCommunityIcons
                            name="help-circle-outline" 
                            style={{color:'white', backgroundColor:'transparent'}}
                            size={15}
                            backgroundColor = 'transparent'
                          />
                        }
                      </Text>

                      { !this.state.currentCriteriaDescriptionVisible || !this.state.curCrit.detail ? null :
                      <Text // Current criteria description.
                        style={{
                          color:'white',
                          textAlign:'center',
                          fontWeight:'normal', 
                          fontSize:16,
                          padding:10, 
                        }}>
                        { this.state.curCrit.detail }
                      </Text>
                      }
                    </TouchableOpacity>
                    { !this.state.curCritSelectedKeys.length ? null :
                    <TouchableOpacity
                      style={{
                        width:65,
                        margin:3,
                        padding:2,
                        borderColor:colors.greenFlash,
                        borderWidth:1,
                         backgroundColor:'white',
                         alignItems:'center', justifyContent:'center',
                      }}
                      onPress={()=>this.setCriteria()}
                      >
                      <Text style={{color:colors.greenFlash,fontWeight:'bold'}}>OK</Text>
                    </TouchableOpacity>
                    }
                  </View>
                  <ScrollView horizontal>
                    { // Current criteria choices.
                    Object.entries(this.state.curCrit.values).map((value, key) => {
                    // this.state.curCrit.values((value, index) => {

                      value=value[1];
                      // console.log(key)
                      // console.log(value)
                      // console.log(this.state.curCrit.photos);

                      return (
                        <ScrollView 
                          key={'crit_choices_' + this.state.curCrit.id + '_' + key}>
                        <TouchableOpacity 
                          style={{
                          marginBottom:20,
                          marginLeft:key>0?1:0,
                          width:critColWidth, 
                          alignItems:'center',
                          }}
                          // onPress={()=>this.setCriteria(value.id, key)}
                          
                          
                          onPress={()=> this.addCurCritValue(value.id, key)}
                          >
                          <View style={{
                                  alignItems:'center', width:critColWidth, backgroundColor:colors.greenFlash }}>
                          <Image
                            source={{uri:'asset:/img/'
                              +'criteres/pictos/'
                              +this.state.curCrit_id
                              +'-'
                              + key //value.id
                              +'.png'}}
                            style={{width:100, height:100, backgroundColor:colors.greenFlash,
                                opacity: this.state.curCritSelectedIds.indexOf(value.id)>=0
                                  ? 0.5
                                  : 1,
                                }} 
                            // resizeMode="contain"
                          />
                          </View>
                          <Text style={{padding:2, marginTop:5, marginBottom:10,fontWeight:'bold',textAlign:'center',
                                     color: this.state.curCritSelectedIds.indexOf(value.id)>=0
                                  ? colors.greenFlash
                                  : 'grey'
                                }}>
                          {value.name} 
                          </Text>
                          { !value.detail ? null :
                            <Text style={{padding:2, textAlign:'center'}}>
                              {value.detail}
                            </Text>
                          }

                          { // Criteria value photo sample.
                            // TODO: zoom.
                           
                            this.state.curCrit.photos && this.state.curCrit.photos[key]
                            ? this.state.curCrit.photos[key].map((path, pathindex)=>
                                <Image
                                  key={pathindex}
                                  source={{uri:'asset:/'+path}}
                                  style={{
                                    opacity: this.state.curCritSelectedIds.indexOf(value.id)>=0
                                      ? 0.3
                                      : 1,
                                    marginTop:10, 
                                    width:critColWidth, 
                                    height:critColWidth, 
                                    backgroundColor:colors.greenFlash,
                                  }} 
                                  resizeMode="contain"
                                /> 
                              )
                            : <Text style={{textAlign:'center'}}>
                                ...
                              </Text>
                          }  


                            <View // Radio button.
                              style={{
                              position:'absolute', top:0, left:0,
                              borderRadius:10,
                              margin:10, marginLeft:20,
                              backgroundColor:'white',
                              height:20, width:20, borderWidth:2, borderColor:colors.greenDark, padding:2, 
                            }}>
                               <View style={{
                                borderRadius:6,
                                height:12, width:12,
                                backgroundColor: this.state.curCritSelectedIds.indexOf(value.id)>=0
                                  ? colors.greenFlash
                                  : 'transparent'
                              }}></View>
                            </View>

                        </TouchableOpacity>
                        </ScrollView>
                      );
                    })}
                  </ScrollView>
                </View>

              : <View // Choose a criteria.
                  style={{flex:1}} >
                  <Text style={{
                    padding:5,
                    backgroundColor:colors.greenFlash,
                    color:'white',
                    textAlign:'center',
                    fontWeight:'normal', 
                    fontSize:16,
                    }}>
                    Sélectionnez un critère
                  </Text>
                  <ScrollView horizontal style={{flex:1}}>
                    { this.state.remainingsCrit.map((value, key)=>
                      <ScrollView key={'remainingsCrit_' + key}>
                      <TouchableOpacity 
                        style={{
                          marginBottom:20,
                          marginLeft:key>0?1:0,
                          width:critChoiceColWidth, 
                          alignItems:'center',
                        }}
                        onPress={()=> this.selectCrit(value.id)}
                        >
                        <View style={{alignItems:'center', width:critChoiceColWidth, backgroundColor:colors.greenFlash }}>
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

                        <Text style={{padding:2, fontWeight:'bold',textAlign:'center', marginBottom:10,}}>
                        {value.name}
                        </Text>
                        { !value.detail ? null :
                          <Text style={{padding:2, fontWeight:'normal',textAlign:'center'}}>
                          {value.detail}
                          </Text>
                        }
                      </TouchableOpacity>
                      </ScrollView>
                    )}
                  </ScrollView>
                </View>
                }


                </View>

                <TouchableOpacity 
                  // Top left corner back button.
                  style={{
                    width:50, height:50,
                    position:'absolute', top:0, left:0,
                    justifyContent:'center', alignItems:'center',
                    backgroundColor:colors.greenFlash,
                  }}
                  onPress={() => this.props.close()}
                  >
                  <MaterialCommunityIcons
                    name="chevron-left" 
                    style={[{ color:'white' }]}
                    size={30}
                  />
                </TouchableOpacity>

                
              </View>
            }


          </View>


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

  showTaxonModal(){
    this.setState({taxonModalVisible:true});
  }
  hideTaxonModal(){
    this.setState({taxonModalVisible:false});
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
                    justifyContent:'center', alignItems:'center',
                    marginBottom:10,
                    padding:1,
                    flexDirection:'row',
                    backgroundColor:colors.greenFlash,
                    // borderColor:'lightgrey', borderWidth:1
                  }}
                  onPress={()=>this.showTaxonModal()}
                  >
         
                    <MaterialCommunityIcons
                      name="database-search" //table-search 
                      style={{ color:'white',backgroundColor:colors.greenFlash }}
                      size={30}
                    />
                    <Text style={{
                    padding:7,
                    fontSize:16,
                    fontWeight:'bold',
                    color:'white',
                    }}>
                    Identification par critères
                  </Text>
           
                </TouchableOpacity>  

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


                { !this.state.taxonModalVisible ? null :
                  <TaxonModal 
                    ref={"modal-taxon-search"}
                    close={()=>this.hideTaxonModal()}
                    sourcesPath={ this.props.collection_storage + '/insects/' + this.props.data.date }
                    source= {{uri:'file://'
                        +this.props.collection_storage + '/insects/'
                        + this.props.data.date 
                        + '/' + this.state.insect.photo}}
                  />
                } 

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
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

import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView from 'react-native-maps';
import DateTimePicker from 'react-native-modal-datetime-picker';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

import FooterImage from './footerimage';
import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';
import AdvancedList from './advancedList';
import { ImageSlider } from './widgets.js';

import CollectionForm from './collectionForm';
import SessionForm from './sessionForm';
import InsectForm from './insectForm';
import { colors } from './colors';
import {
  date2folderName,
  formatFolderName,
  formatDate,
  formatTime,
 } from './formatHelpers.js';


//=========================================================================================
class Collection extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    this.state = {
      tab: 'collection',//'collection', // TODO depending on collection state.
    }
  }

  setTab(value){
    // Back to sessions list.
    if(value=='sessions' && this.state.tab=='sessions' && this.props.data.protocole=='long'){
      this.refs['session-list'].selectItem(false);
    }
    else if(value=='sessions' && this.props.data.protocole=='flash'){
      this.setState({tab:value}, function(){
        this.refs['session-list'].selectItem(0);
      });
    }

    else if(value=='insectes' && this.state.tab=='insectes'){
      this.refs['insect-list'].selectItem(false);
    }

    else{
      this.setState({tab:value});
    }
  }

  renderCollectionTabs(){
    return(
      <View style={{margin:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
        {/*<ScrollView horizontal={true}>*/}
         
           <TouchableOpacity 
            style={{ marginLeft:5, marginRight:5,
              flexDirection:'row', justifyContent:'center', alignItems:'center', 
              // borderRightWidth:1, borderRightColor:'lightgrey',
              }}
            onPress = {() => this.setTab('collection')} 
            >
            <MaterialCommunityIcons
              name="flower"  // search-web  magnify  map-search
              style={{
                backgroundColor:'transparent',
                margin:5,
                color:colors.greenFlash,
              }}
              size={25}
            />
            <Text style={{ fontSize:16,
              color: this.state.tab=='collection'? colors.greenFlash :'grey'}}>
            Fleur</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginLeft:5, marginRight:5,
              flexDirection:'row', justifyContent:'center', alignItems:'center', 
              // borderRightWidth:1, borderRightColor:'lightgrey',
              }}
            onPress = {() => this.setTab('sessions')} 
            >
            <MaterialCommunityIcons
              name="calendar-clock"  // search-web  magnify  map-search
              style={{
                backgroundColor:'transparent',
                margin:5,
                color:colors.greenFlash,
              }}
              size={25}
            />
            <Text style={{ fontSize:16,
              color: this.state.tab=='sessions'? colors.greenFlash :'grey'}}>
            Session{this.props.protocole=='flash'?'':'s'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginLeft:5, marginRight:5,
              flexDirection:'row', justifyContent:'center', alignItems:'center', 
              // borderBottomWidth:1, borderBottomColor:'grey',
              }}
            onPress = {() => this.setTab('insectes')} 
            >
            <MaterialCommunityIcons
              name="ladybug"  // search-web  magnify  map-search
              style={{
                backgroundColor:'transparent',
                margin:5,
                color:colors.greenFlash,
              }}
              size={25}
            />
            <Text style={{ fontSize:16, 
              color: this.state.tab=='insectes'? colors.greenFlash :'grey'}}>
            Insectes</Text>
          </TouchableOpacity>
        {/*</ScrollView>*/}
      </View>
    );
  }

  //--------------------------------------------------------------------------------
  renderInsectListItem(value, index){
    return(
      <View style={{flex:1, flexDirection:'row', padding:5}}>
        <Text>{index} - </Text>
        <Text>{ 
          value.taxon_extra_info || value.taxon_name || 'Non identifié' 
        }</Text>

        <ImageSlider/>
      </View>
    );
  }

  renderInsectForm(data){
    return(
      <View style={{flex:1}}>
        <InsectForm
          collection_id = {this.props.data.date}
          data={data}
          valueChanged={(key,val) => this.insectChanged(key,val)}
          // session_id = data.time_start
          // TODO: list of sessions
        />
      </View>
    );
  }

  insectChanged(key, val){
    if(key=='editing'){
      this.refs['insect-list'].selectItem(false);
    }
    else {
      this.refs['insect-list'].storeItemField(key,val);
    }
  }

  deleteInsect(){
    // TODO: delete photos
  }

  //--------------------------------------------------------------------------------
  renderSessionListItem(value, index){
    return(
      <View style={{padding:5, overflow:'hidden'}}>
        <View style={{flexDirection:'row', flex:1}}>
          {/*
          // TODO: météo
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
          */}
          <Text style={[styles.listItemText, {fontWeight:'normal', fontSize:16}]}>
            { value.time_start > new Date().getTime()
            ? <MaterialCommunityIcons
                  name="alarm" 
                  style={{color:colors.greenFlash}}
                  size={20}
                /> 
            : ''
            } {formatDate(value.date)}
            </Text>
        </View>
        <View> 
          <Text style={styles.listItemText}>
          { value.time_start
              ? formatTime(value.time_start) + ' - '
              : <Text style={{fontWeight:'bold', fontSize:16, color:colors.greenFlash}}>En attente</Text>
          }
          { value.time_end 
            ? formatTime(value.time_end)
            : value.time_start
              ? <Text style={{fontWeight:'bold', fontSize:16, color:colors.greenFlash}}> En cours</Text>
              : ''
          }
          </Text>
        </View>
      </View>  
    );
  }

  renderSessionForm(data){
    return(
      <SessionForm 
        ref="session-form"
        collection_id = {this.props.data.date}
        protocole={this.props.data.protocole}
        data={data}
        valueChanged={(key,val) => this.sessionChanged(key,val)}
        
        // pickPhoto = {(field) => this.props.pickPhoto('collection--'+this.props.data.date+'--'+field)}
        pickPhoto = {(field) => this.pickPhoto('collection--'+this.props.data.date+'--'+field)}
      />
    );
  }

  newSession(){
    return {
        date:'',
        time_start:'',
        time_end:'',
        smpAttr_24:'',
        smpAttr_25:'',
        smpAttr_26:'',
        shadow:'',
    };
  }

  sessionChanged(key, val){
    if(key=='editing'){
      this.refs['session-list'].selectItem(false);
    }
    else {
      this.refs['session-list'].storeItemField(key,val);
    }
  }

  deleteSession(session){
    // TODO: remove that session reference on insects.
  }

  collectionChanged(key, val){
    if(key=='editing'){
      this.props.selectItem(false);
    }
    else {
      this.props.storeItemField(key,val);
    }
  };

  //--------------------------------------------------------------------------------

  pickPhoto(field){
    console.log('pickPhoto',field);
    this.props.pickInsectPhoto(field);
  }

  
  render(){
      console.log(this.props.data);
    return(
      <View style={{flex:1}}>
        { this.renderCollectionTabs() }

        { this.state.tab=='collection' 
        ? <CollectionForm 
            ref="collection-form"
            data={this.props.data}
            valueChanged={(key,val) => this.collectionChanged(key,val)}
            filePath={this.props.filePath} // todo: remove
            pickPhoto = {(field) => this.props.pickPhoto('collection--'+data.date+'--'+field)}

            pickInsectPhoto= {(field) => this.pickInsectPhoto('collection--'+data.date+'--'+field)}
          />

          : this.state.tab=='sessions'
          ? <AdvancedList
              ref="session-list"
              localStorage = {this.props.data.date + "_sessions"}
              renderListItem = {(value, index) => this.renderSessionListItem(value, index)}
              renderDetailedItem = {(data) => this.renderSessionForm(data)}

              newItem = {() => this.newSession()}
              newItemLabel = "Nouvelle Session"
              deleteItem = {() => this.deleteSession()}
            />
       
          : this.state.tab=='insectes' 
          ? <AdvancedList
              key="insect-list"
              ref="insect-list"
              localStorage = {this.props.data.date + "_insects"}
              renderListItem = {(value, index) => this.renderInsectListItem(value, index)}
              renderDetailedItem = {(data) => this.renderInsectForm(data)}

              newItem = {() => this.newInsect()}
              newItemLabel = {false}
              deleteItem = {() => this.deleteInsect()}
            />
          : null
          }
      </View>
    );
  }
}

//=========================================================================================
export default class CollectionList extends Component {
//-----------------------------------------------------------------------------------------
 constructor(props) {
    super(props);
  }


  newCollection(){
    const now = date2folderName();

    // Create Folder.
    this.props.createCollectionFolders(now);

    // Create stored data.
    AsyncStorage.setItem(now+'_collection', JSON.stringify({
      name:'',
      protocole:'',
      place:{
        lat:false,
        long:false,
        name:''
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
        locAttr_2:'',     // NOT MANDATORY            //  ruche
        locAttr_1:[],   // NOT MANDATORY              //  habitat
        locAttr_3:false,                 //  grande culture en fleur
      },
    }));

    // Return data to list.
    return {
      name:'',
      protocole:'',
      place:{lat:'', long:'', name:''},
      date:now,
    }
  }

  deleteCollection(collection){
    // Delete stored data.
    AsyncStorage.removeItem(collection.date+'_collection');
    AsyncStorage.removeItem(collection.date+'_sessions');
    AsyncStorage.removeItem(collection.date+'_insects');

    // Delete folder.
    this.props.deleteCollectionFolders(collection_name);
  }

  pickInsectPhoto(field){
    console.log('pickInsectPhoto CollectionList', field);
    this.props.pickInsectPhoto('collection---'+field);
  }

  renderCollection(data){
    return(
      <Collection
        data={data}
        selectItem={(index) => this.refs['collections'].selectItem(index)}
        storeItemField={(key,val) => this.refs['collections'].storeItemField(key,val)}
      />
    );
  }

  renderCollectionListItem(value, index){
    return(
    <React.Fragment>
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
      </React.Fragment>
    );
  }

  render(){
    return(
       <View style={{flex:1}}>
        <AdvancedList
          ref="collections"
          localStorage = "collections"
          renderListItem = {(value, index) => this.renderCollectionListItem(value, index)}
          renderDetailedItem = {(data) => this.renderCollection(data)}

          newItem = {() => this.newCollection()}
          newItemLabel = "Nouvelle Collection"
          deleteItem = {(item) => this.deleteCollection(item)}
        />
      </View>
    );
  }

} // Main CollectionList

const styles = StyleSheet.create({ 

});
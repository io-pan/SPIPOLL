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
  ScrollView,
  AsyncStorage,
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

const deviceWidth = Dimensions.get('window').width;
    // this.itemWidth = this.deviceWidth/props.tabs.length;

//=========================================================================================
class CollectionNavTabs extends Component {
//-----------------------------------------------------------------------------------------

  constructor(props) {
    super(props);


    this.state = {
      tab: 'flower', // TODO depending on collection state.
    }
  }

  setTab(value){
    let bigScrollX = 0;

    if(value=='flower'){
     
    }
    else if(value=='calendar-clock'){
      bigScrollX = 1*Dimensions.get('window').width;
    }
    else if(value=='ladybug'){
      bigScrollX = 2*Dimensions.get('window').width;
    }

    this.setState({tab:value});
    this.props.tabSet(bigScrollX, value);
  }

  scroll(event){         
    const pos = event.nativeEvent.contentOffset.x;

    let tab = ''
    if(pos == 0){
      tab = 'flower';
    }
    else if(pos == deviceWidth){
      tab = 'calendar-clock';
    }
    else if(pos == 2*deviceWidth){
      tab = 'ladybug';
    }
    if(tab){
      this.setState({tab:tab});     
    }
  }

  render(){
    return(
      <View // Tabs.
        style={{margin:0, flexDirection:'row', alignItems:'center', justifyContent:'space-around'}}
        >
        {/*<ScrollView horizontal={true}>*/}
        { this.props.tabs.map((tab, index) =>
         <TouchableOpacity 
          key={index}
          style={{ marginLeft:5, marginRight:5,
            width:deviceWidth/this.props.tabs.length,
            flexDirection:'row', justifyContent:'center', alignItems:'center', 
            // borderRightWidth:1, borderRightColor:'lightgrey',
          }}
          onPress = {() => this.setTab(tab.icon)} 
          >
          <MaterialCommunityIcons
            name={tab.icon}
            style={{
              backgroundColor:'transparent',

              color:colors.greenFlash,
            }}
            size={25}
          />
          <Text style={{ fontSize:16, marginLeft:5,
            color: this.state.tab==tab.icon ? colors.greenFlash :'grey'}}>
          {tab.text}</Text>
        </TouchableOpacity>
        )}
        {/*</ScrollView>*/}
      </View>
    );
  }
};


//=========================================================================================
class Collection extends Component {
//-----------------------------------------------------------------------------------------
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.data.name,
    }

    this.tabIndicatorX = new Animated.Value(0);
    this.tabs = [{
        icon:'flower',
        text:'Fleur'
      },{
        icon:'calendar-clock',
        text:'Session'+(this.props.data.protocole=='flash'?'':'s')
      },{
        icon:'ladybug',
        text:'Insectes'
    }];

  }

  componentDidMount(){
    if(!this.state.name){
      this.refs['name'].focus();
    }
  }


  edit(field){
    this.tempValue = this.state[field];
    this.setState({[field]:''}, function(){
      this.refs[field].focus();
    });
  }

  save(field, value){
    if(value){
      this.setState({[field]:value}, function(){
        this.refs['collection-form'].storeListItem(field, value);
      });
    }
    else{
      this.setState({[field]:this.tempValue});
    }
  }

  collectionChanged(key, val){
    if(key=='editing'){
      this.props.selectItem(false);
    }
    else {
      this.props.storeItemField(key,val);
    }
  };

  renderCollectionEditableName(){
    return (
      this.state.name
      ? <View style={{flexDirection:'row', height:50, borderBottomWidth:1, borderBottomColor:'white', }}>
          <TouchableOpacity 
            style={[{
              padding:10,
              borderRightWidth:1, borderRightColor:'white', 
              backgroundColor:colors.greenFlash,
            }]}
            onPress = {() => this.collectionChanged('editing', false)} 
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
            <Text style={[styles.titleTextStyle,{flex:1}]}>{this.state.name}</Text>
            <MaterialCommunityIcons
              name="pencil" 
              style={[{color:'white', paddingTop:10, width:50, backgroundColor:colors.greenFlash} ]}
              size={25}
              backgroundColor = 'transparent'
            />
          </TouchableOpacity>
        </View>

      : <TextInput
          ref="name"
          style={styles.collection_input_text}
          placeholder={this.tempValue || 'Nom de la collection'}s
          onEndEditing = {(event) => this.save('name', event.nativeEvent.text)} 
          onSubmitEditing = {(event) => this.save('name', event.nativeEvent.text)} 
        />
    );
  }

  //========================================================================================

  renderInsectListItem(value, index){
    return(
      <View style={{flex:1, flexDirection:'row', padding:5}}>
        <Image
          style={{ 
            margin:1,
            width:80,
            height:80,
          }}
          resizeMode="contain"
          source={{uri:'file://' + this.props.data.storage.path + '/' + this.props.data.date 
                    + '/insects/' + value.date + '/' + value.photo}}
        />

        <Text>{ 
          value.taxon_extra_info || value.taxon_name || 'Non identifié' 
        }</Text>

        <ImageSlider/>
      </View>
    );
  }

  renderInsectForm(data, index){
    return(
      <View style={{flex:1}}>
        <InsectForm
          // collection_id = {this.props.data.date}
          collection_storage = {this.props.data.storage.path + '/' + this.props.data.date}
          index={index}
          data={data}
          valueChanged={(key,val) => this.insectChanged(key,val)}
          // session_id = data.time_start // TODO: list of sessions
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

  deleteInsect(data) {
    // Delete photos folder.
    const folder = this.props.data.storage.path + '/' + this.props.data.date + '/insects/' + data.date;
    RNFetchBlob.fs.unlink(folder)
    .then(() => { 
      // console.log('insect folder deleted ' + folder)
    })
    .catch((err) => {
      Alert.alert(
        'Erreur',
        'Le dossier contenant les photos n\'a pu être supprimé.\n'
        + folder
      );
    }); 
  }

  //--------------------------------------------------------------------------------
  renderSessionListItem(value, index){
    console.log(value);
    return(
      <View style={{padding:5, overflow:'hidden'}}>
        <View style={{flexDirection:'row', flex:1}}>

          { !value.smpAttr_24 ? null :
            <MaterialCommunityIcons
              name={ value.smpAttr_24 == 123 
              ? 'weather-sunny' 
              : value.smpAttr_24 == 126 
                ? 'weather-cloudy'
                : 'weather-partlycloudy'
              }
              style={[styles.listItemText,{

                }]}
              size={25}
            />
          }
          
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

  renderSessionForm(data, index){
    return(
      <SessionForm 
        ref="session-form"
        collection_id = {this.props.data.date}  // For localstorage of insect list on running session.
        collection_storage = {this.props.data.storage.path + '/' + this.props.data.date} // To store insect photos on running session.
        protocole={this.props.data.protocole} // To check sessions durations.
        index={index}
        data={data}
        valueChanged={(key,val) => this.sessionChanged(key,val)}
        // pickInsectPhoto = {( session_id, insectKind_id, insect_id) => 
        //   this.props.pickInsectPhoto(this.props.data.date, index, insectKind_id, insect_id)}
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
    // TODO: remove session reference on insects.
  }

  //----------------------------------------------------------------------

  tabSet(x, tab){
    this.refs['bigscroll'].scrollTo({x: x, y: 0, animated: true});

    if(tab=='calendar-clock'){
      this.refs['session-list'].selectItem(
        this.props.data.protocole=='flash'
        ? 0     // Show default flash session
        : false // Show sessions list
      );
    }
    else if(tab=='ladybug'){
      this.refs['insect-list'].selectItem(false);
    }
  }

  render(){
    return(
      <View style={{flex:1}}>
      
        { this.renderCollectionEditableName() }
        
        { !this.props.data.storage.path || !this.props.data.name || !this.props.data.protocole 
          ? null 
          : 
            <View style={{marginTop:10}}>
              <CollectionNavTabs
                ref="CollectionNavTabs"
                protocole={this.props.data.protocole}
                tabs={this.tabs}
                tabSet={(x, tab)=>this.tabSet(x, tab)}
              />

              <View // Tabs indicator.
                style={{marginTop:5, height:12}}>
                <Animated.View
                  style={{
                    position: 'absolute', top: 0, left:0,
                    transform: [{ translateX: 
                      this.tabIndicatorX.interpolate({
                        inputRange: [0,deviceWidth],
                        outputRange: [0,deviceWidth/this.tabs.length],
                      }) 
                    }],
                    margin:10,marginTop:0,
                    width:deviceWidth/this.tabs.length - 20,
                    height:2,backgroundColor: colors.greenFlash
                  }}
                />
              </View>
            </View>
        }


        <ScrollView
          ref="bigscroll"
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={10}
          pagingEnabled
          scrollEnabled = { !(!this.props.data.storage.path || !this.props.data.name || !this.props.data.protocole) }
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: this.tabIndicatorX}}}],
            {listener: (event) => {
              // Highlight tab.
              this.refs['CollectionNavTabs'].scroll(event);


              // TODO:
              //
              // . new insects do not appear in tab insect list
              // . deal with backHandler here
 


              // Close lists.
              if(event.nativeEvent.contentOffset.x == 0){ //  tab = 'flower';     
                this.refs['session-list'].selectItem(this.props.data.protocole=='flash' ? 0 : false);
                this.refs['insect-list'].selectItem(false);
              }

            
              else if(event.nativeEvent.contentOffset.x == deviceWidth){ // tab = 'calendar-clock';
                this.refs['insect-list'].selectItem(false);
                if(this.props.data.protocole=='flash'){ 
                  // Show default flash session.        
                  this.refs['session-list'].selectItem(0);
                }
              }

              else if(event.nativeEvent.contentOffset.x == 2*deviceWidth){ //  tab = 'ladybug';  
                this.refs['session-list'].selectItem(this.props.data.protocole=='flash' ? 0 : false);
              }
            }}
          )}
        >
     
          <View style={{width: Dimensions.get('window').width}}>
            <CollectionForm 
              ref="collection-form"
              data={this.props.data}
              valueChanged={(key,val) => this.collectionChanged(key,val)}
              pickPhoto = {(field) => this.pickPhoto(this.props.data.date, field)}
            />
          </View>

          <View style={{width: Dimensions.get('window').width}}>
            <AdvancedList
              ref="session-list"
              localStorage = {this.props.data.date + "_sessions"}
              renderListItem = {(value, index) => this.renderSessionListItem(value, index)}
              renderDetailedItem = {(data, index) => this.renderSessionForm(data, index)}

              newItem = {(index) => this.newSession(index)}
              newItemContent = {this.props.data.protocole=='flash' ? false : 
                <View style={{backgroundColor:colors.greenFlash, flexDirection:'row', alignItems:'center', justifyContent:'center', height:50}}
                  >
                  <MaterialCommunityIcons   
                    name='plus-circle-outline'
                    style={{fontSize:30, paddingRight:10, color:'white'}}
                  />
                  <Text style={{color: 'white', fontSize:18, fontWeight:'bold'}}>
                  Nouvelle Session</Text>
                </View>
               }
              deleteItem = {() => this.deleteSession()}
            />
          </View>

          <View style={{width: Dimensions.get('window').width}}>
            <AdvancedList
              key="insect-list"
              ref="insect-list"
              localStorage = {this.props.data.date + "_insects"}
              renderListItem = {(value, index) => this.renderInsectListItem(value, index)}
              renderDetailedItem = {(data, index) => this.renderInsectForm(data, index)}
              newItemContent = {false}
              deleteItem = {(data, index) => this.deleteInsect(data, index)}
            />
          </View>

        </ScrollView>
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
      hasRemovalStorage:0,
    };
  }

  componentDidMount(){
    NativeModules.ioPan.getExternalStorages()
    .then((dirs) => {
      this.setState({hasRemovalStorage:JSON.parse(dirs).length});
    });
  }

  newCollection(){
    const now = date2folderName();

    // Create stored data.
    AsyncStorage.setItem(now+'_collection', JSON.stringify({
      storage:{type:false, path:false},
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

    // Return data required for list.
    return {
      storage:{type:false, path:false},
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
    RNFetchBlob.fs.unlink(collection.storage.path+'/'+collection.date)
    .then(() => { 
      console.log('collection folder deleted ' + collection.storage.path+'/'+collection.date )
    })
    .catch((err) => {
      Alert.alert(
        'Erreur',
        'Le dossier contenant les photos n\'a pu être supprimé.\n'
        + collection.storage.path+'/'+collection.date
      );
    }); 
  }

  renderCollection(data){
    return(
      <Collection
        ref="collection"
        data={data}
        selectItem={(index) => this.refs['collections'].selectItem(index)} // For back buton (chevron-left in title bar).
        storeItemField={(key,val) => this.refs['collections'].storeItemField(key,val)}// For collection name (in title bar).
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
        source={{uri:'file://' + value.storage.path + '/' + value.date +'/flower/' + value.photo_flower}}
      />
      <Image
        style={{ 
          margin:1,
          width:80,
          height:80,
        }}
        resizeMode="contain"
        source={{uri:'file://' + value.storage.path + '/' + value.date +'/environment/' + value.photo_environment}}
      />

      <View style={{padding:5, overflow:'hidden'}}>
        <View style={{flexDirection:'row', flex:1}}>
          <MaterialCommunityIcons
            // TODO: number of insects.
            name={ value.protocole == 'flash' 
            ? 'flash-outline' 
            : value.protocole == 'long' 
              ? 'timer-sand'
              : 'help-circle-outline'
            }
            style={[styles.listItemText,{
              margin:0,
              marginTop:5,
              }]}
            size={18}
          />

          { !this.state.hasRemovalStorage ? null :
            <MaterialCommunityIcons
              name={ value.storage.type == 'phone' 
              ? 'cellphone-android' 
              : value.storage.type == 'card' 
                ? 'micro-sd'
                : 'help-circle-outline'
              }
              style={[styles.listItemText,{
                margin:0,
                marginTop:5,
                marginRight:5,
                }]}
              size={18}
            />
          }

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
          newItemContent = {
            <View style={{
              backgroundColor:colors.greenFlash, flexDirection:'row', alignItems:'center', justifyContent:'center', height:50}}
              >
              <MaterialCommunityIcons   
                name='plus-circle-outline'
                style={{fontSize:30, paddingRight:10, color:'white'}}
              />
              <Text style={{color: 'white', fontSize:18, fontWeight:'bold'}}>
              Nouvelle Collection</Text>
            </View>
          }
          deleteItem = {(item) => this.deleteCollection(item)}
        />
      </View>
    );
  }

} // Main CollectionList


const styles = StyleSheet.create({
  collection_input_text:{
    padding:5,
    marginTop:5, marginBottom:5,
    marginLeft:15,
    marginRight:15,
    fontSize:18,
    textAlign:'center',
    backgroundColor:'white',
    borderColor:colors.greenFlash,
    borderWidth:1,
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
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
      status:{
        'flower':false,
        'calendar-clock':false, 
        'ladybug':false,
      }
    }
    this.globalStatus = false;
  }

  getGlobalStatus(){
    let globalStatus = true;
    for(var index in this.state.status) { 
      if (this.state.status.hasOwnProperty(index)) {
        if(!this.state.status[index]){
          return false;
        };
      }
    }
    return globalStatus;
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

  formStatus(key, valid){
    console.log('formStatus '+ key, valid);
    // let curTab = this.state.tab;
    // if(!this.state.status[key] && valid){
    //   // Whole tab just become valid, go to next tab.
    //   if (curTab =='flower'){
    //     curTab = 'calendar-clock';
    //   }
    //   else if(curTab == 'calendar-clock'){
    //     curTab = 'ladybug';
    //   }
    //   else{

    //   }
    // }

    this.setState({
      // tab:curTab,
      status:{
        ...this.state.status,
        [key]:valid,        
      }
    },function(){
        // let globalStatus = true;
        // for(var index in this.state.status) { 
        //   if (this.state.status.hasOwnProperty(index)) {
        //     if(!this.state.status[index]){
        //       globalStatus = false;
        //     };
        //   }
        // }
      }
    );
  }

  render(){

    return(
      <View>

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
                // color:colors.greenFlash,
                color: this.state.status[tab.icon] ? colors.greenFlash :  colors.purple 
              }}
              size={25}
            />
            <Text style={{ fontSize:16, marginLeft:5,
              // color: this.state.tab==tab.icon ? colors.greenFlash :'grey'
              color: this.state.status[tab.icon] ? colors.greenFlash :  colors.purple 
            }}>
            {tab.text}</Text>
          </TouchableOpacity>
          )}
          {/*</ScrollView>*/}
        </View>


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
      published: this.props.data.published,
    }

    this.tabIndicatorX = new Animated.Value(0);
    this.tab = 'flower';
    this.tabs = [{
        icon:'flower',
        text:'Fleur'
      },{
        icon:'calendar-clock',
        text:'Session'+(this.props.data.protocole=='flash'?'':'s')
        // TODO: on new collection, protocole is not set yes so we always have sessionS.
      },{
        icon:'ladybug',
        text:'Insectes'
    }];

  }

  componentDidMount(){
    if(!this.state.name){
      this.refs['name'].focus();
    }

    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // BackHandler behaviour:
      // 1. return to advancedlist if insect or session form is open
      // 2. go to previous tab
      // 3. go to collection list

      if (this.tab == 'flower'){
        this.collectionChanged('editing', false);
      }

      else if (this.tab == 'calendar-clock'){
        if ((this.refs['session-list'].state.editing!==false  || Array.isArray(this.refs['session-list'].state.selectedItems))
        && this.props.data.protocole!='flash' ){
          this.refs['session-list'].selectedItems(false);
          this.refs['session-list'].selectItem(false);
        }
        else{
          this.refs['CollectionNavTabs'].setTab('flower');
        }
      } 

      else if (this.tab == 'ladybug'){
        if (this.refs['insect-list'].state.editing!==false || Array.isArray(this.refs['insect-list'].state.selectedItems)){
          this.refs['insect-list'].selectedItems(false);
          this.refs['insect-list'].selectItem(false);
        }
        else{
          this.refs['CollectionNavTabs'].setTab('calendar-clock');
        }
      } 
      return true;      
    });
  }

  componentWillUnmount(){
    this.backHandler.remove();
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
    console.log('collectionChanged: ' + key, val);
    if(key=='editing'){
      this.props.selectItem(false);
    }

    else { // name, protocole, storage.
      this.props.storeItemField(key,val);

      if(key=='status_flower' && this.refs['CollectionNavTabs']){
        this.refs['CollectionNavTabs'].formStatus('flower', val)
      }
    }
  };


  publishCollection(){
    // TODO:
    // Open login modal

    // Do stuff

    // Flag collection as published.
    this.setState({published:true}, function(){
      this.refs['collection-form'].storeListItem('published', true);
    });
  }


  renderCollectionEditableName(){
    console.log('renderCollectionEditableName', this.state);

    const readyForPublication =  this.refs['CollectionNavTabs'] 
      ? this.refs['CollectionNavTabs'].getGlobalStatus() && !this.state.published
      : false;

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

          { !this.state.published
          ? // Editable name.
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
          : // Readonly name.
            <View 
              style={{flexDirection:'row', flex:1,}}
              onPress = {() => this.edit('name')} 
              >
              <Text style={[styles.titleTextStyle,
                {flex:1, backgroundColor:colors.background, color:colors.greenFlash }]}
                >{this.state.name}</Text>
            </View>
          }

          { // Publish button.
            !readyForPublication ? null :
            <TouchableOpacity 
              style={[{
                padding:10,
                borderLeftWidth:1, borderLeftColor:'white', 
                backgroundColor:colors.purple,
              }]}
              onPress = {() => this.publishCollection()}  
              >
              <MaterialCommunityIcons
                name={'file-send'}
                style={[{ color:'white',
                }]}
                size={30}
              />
            </TouchableOpacity>
          }
        </View>

      : <TextInput
          ref="name"
          style={styles.collection_input_text}
          placeholder={this.tempValue || 'Nom de la collection'}
          onEndEditing = {(event) => this.save('name', event.nativeEvent.text)} 
          onSubmitEditing = {(event) => this.save('name', event.nativeEvent.text)} 
        />
    );
  }

  //========================================================================================

  renderInsectListItem(value, index){

    const color = this.isValidItem(value) ? 'grey' : colors.purple;

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

        <Text style={{color:color}}>{ 
          value.taxon_extra_info || value.taxon_name || ('Espèce ' + (index+1) + ' - Non identifiée' )
        }</Text>

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
          extractPhotos={(paths, session_id, selectedImageMoved)=>this.extractPhotos(paths, session_id, selectedImageMoved)}
        />
      </View>
    );
  }

  mergeInsects(mergedItems, originalItem){
    // Move photos to right folder.
    const dest_folder = this.props.data.storage.path + '/' + this.props.data.date + '/insects/' + originalItem.date;
     
    // console.log('mergeInsects',dest_folder);
    for(i=0; i<mergedItems.length; i++){

      // Scan old folder.
      const src_folder = this.props.data.storage.path + '/' + this.props.data.date + '/insects/' + mergedItems[i].date;
      // console.log('SRC FOLDER', src_folder);
      RNFetchBlob.fs.ls(src_folder)
      .then((files) => {
        // console.log(files);
        this.moveFilesThenDeleteFolder(files, src_folder, dest_folder);
      });
    }
  }

  moveFilesThenDeleteFolder(files, src_folder, dest_folder){

    if(files.length){

      RNFetchBlob.fs.mv(src_folder + '/' + files[0],  dest_folder + '/' + files[0])
      .then(() => { 
        // console.log('file moved', files[0])
        files.shift();
        this.moveFilesThenDeleteFolder(files , src_folder, dest_folder)
      })
      .catch((err) => {
        // console.log("ERROR: La photo " + files[0] + " n'a pas été déplacée de\n"+ src_folder + "\nvers\n" + dest_folder);
        // console.log(err);
        Alert.alert(
          'Erreur',
          "La photo " + files[0] + " n'a pas été déplacée de\n"+ src_folder + "\nvers\n" + dest_folder
        );
      })
    }
    else{
      // console.log('unlink', src_folder);
      RNFetchBlob.fs.unlink(src_folder)
      .then(() => { 
        // console.log('insects merged');
      })
      .catch((err) => {
        Alert.alert(
          'Erreur',
          'Le dossier contenant les photos n\'a pu être supprimé.\n' + src_folder
        );
      }); 
    }
  }

  extractPhotos(paths, session_id, selectedImageMoved){
    const now = date2folderName(),
          newFolder = this.props.data.storage.path + '/' + this.props.data.date  + '/insects/' + now,
          newCreatedInsect = {
            taxon_list_id_list:null,
            taxon_name:null,
            comment:null,
            occAttr_4:null, // Nombre maximum d'individu
            occAttr_5:null, //Insecte photographié sur la fleu
            session:session_id,
            photo:null,
            date:now, // So we now in which folder photos are. 
          };

    if(selectedImageMoved){
      this.refs['insect-list'].storeItemField('photo', null);
    }

    // Create insect
    this.refs['insect-list'].newItem(newCreatedInsect);

    // Create new insect photos folder and copy photos.
    // this.copied=0;
    RNFetchBlob.fs.mkdir(newFolder)
    .then(() => { 
      // Move photo to new folder.
      for(i=0; i<paths.length; i++){
        const clean_name = paths[i].url.split('?')[0].replace('file://',''),
              splited = clean_name.split('/'),
              dest = splited[splited.length-1];


        RNFetchBlob.fs.mv(clean_name,  newFolder + '/' + dest)
        .then(() => { 
          // this.copied++;
          // if(i==paths.length-1){
          // }
         })
        .catch(() => {
          Alert.alert(
            'Erreur',
            "La photo " + dest + " n'a pas été déplacée vers\n" + newFolder
          );
        })
      }

    })
    .catch((err) => { 
      console.log(err);
      Alert.alert(
        'Erreur',
        "Le dossier de stockage des photos n'a pu être créé.\n"
        + newFolder
      );
    })
  }

  insectChanged(key, val){
    if(key=='editing'){
      this.refs['insect-list'].selectItem(false);
    }
    else {
      this.refs['insect-list'].storeItemField(key,val);
    }
    this.areValidItems('ladybug', this.refs['insect-list'].state.items);
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

  isValidItem(item){
    for(var index in item) { 
     if (item.hasOwnProperty(index)) {
        if(item[index] === null){
          return false;
        };
     }
    }
    return true;
  }


  areValidItems(tab, items){
    let valid = true;

    if(!items || !items.length){
      valid = false;
    }
    else{
      for(var i=0; i<items.length; i++) { 
        if (!this.isValidItem(items[i])) {
          valid = false;
        }
      }
    }

    // Change tab color.
    if(this.refs['CollectionNavTabs']){
      this.refs['CollectionNavTabs'].formStatus(tab, valid);
    }

    // Update main list.
    this.props.storeItemField(
      tab=='flower' ? 'status_flower' // shouldn't append since we check list. ie: sessions or insects.
      :tab=='calendar-clock' ? 'status_sessions'
      :'status_insects', valid); 
  }

  //--------------------------------------------------------------------------------
  renderSessionListItem(value, index){
    const color = this.isValidItem(value) ? 'grey' : colors.purple;
    return(
   
        <View style={{flexDirection:'row', flex:1,  alignItems:'center', justifyContent:'center', height:50, paddingLeft:10,}}>

          
            { !value.smpAttr_24 ? null :
              <MaterialCommunityIcons
                name={ value.smpAttr_24 == 123 
                ? 'weather-sunny' 
                : value.smpAttr_24 == 126 
                  ? 'weather-cloudy'
                  : 'weather-partlycloudy'
                }
                style={[styles.listItemText,{
                  color:color,
                  marginRight:10,
                  }]}
                size={25}
              />
            }
          
            { value.time_start > new Date().getTime()
            ? <MaterialCommunityIcons
                  name="alarm" 
                  style={{color:colors.purple, marginRight:10, fontWeight:'bold'}}
                  size={30}
                /> 
            : null
            }  

            <Text style={[styles.listItemText, {  fontSize:18, fontWeight:'normal', color:color}]}>
              {value.date ? formatDate(value.date) + '  ' : '  '}
            </Text>

            <Text style={[styles.listItemText,{fontSize:16}]}>
              { value.time_start
                  ? formatTime(value.time_start) + ' - '
                  : <Text style={{fontWeight:'bold', fontSize:18, color:colors.purple}}>En attente</Text>
              }
              { value.time_end 
                ? formatTime(value.time_end)
                : value.time_start
                  ? <Text style={{fontWeight:'bold', fontSize:18, color:colors.purple}}> En cours</Text>
                  : ''
              }
            </Text>
    
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
        date:null,
        time_start:null,
        time_end:null,
        smpAttr_24:null,
        smpAttr_25:null,
        smpAttr_26:null,
        smpAttr_27:null,
    };
  }

  sessionChanged(key, val){
    if(key=='editing'){
      this.refs['session-list'].selectItem(false);
    }
    else {
      this.refs['session-list'].storeItemField(key,val);
    }
    this.areValidItems('calendar-clock', this.refs['session-list'].state.items);
  }

  deleteSession(session, index){
    // Delete insects attached to that session.
    if(session.date && session.time_start){
      let insectsToDelete = [];
      const insects = this.refs['insect-list'].state.items;

      for(i=0; i<insects.length; i++){
        // console.log(insects[i].session)
        if(insects[i].session == session.date + '_' +session.time_start){
          insectsToDelete.push(i);
        }
      }
      if(insectsToDelete.length){
        this.refs['running-insect-'].deleteItems(insectsToDelete); 
      }
    }
  }

   
  //----------------------------------------------------------------------

  render(){
    console.log('render COLLECTION');

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
                tabSet={(x, tab)=> {
                  this.refs['bigscroll'].scrollTo({x: x, y: 0, animated: true});
                  this.tab = tab;

                  if(tab=='calendar-clock' && this.props.data.protocole!='flash'){
                    this.refs['session-list'].selectItem(false);
                  }
                  else if(tab=='ladybug'){
                    this.refs['insect-list'].selectItem(false);
                  }
                }}
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

              // Close lists.
              if(event.nativeEvent.contentOffset.x == 0){ //  tab = 'flower';     
                this.tab = 'flower';
                this.refs['session-list'].selectItem(this.props.data.protocole=='flash' ? 0 : false);
                this.refs['insect-list'].selectItem(false);
              }

              else if(event.nativeEvent.contentOffset.x == deviceWidth){ // tab = 'calendar-clock';
                this.tab = 'calendar-clock';
                this.refs['insect-list'].selectItem(false);

                // Show/create default flash session.
                if(this.props.data.protocole=='flash'){ 
                  if(!this.refs['session-list'].state.items.length){
                    this.refs['session-list'].selectItem(0);
                  }
                  else {
                    this.refs['session-list'].selectItem(0);     
                  }
                }
              }

              else if(event.nativeEvent.contentOffset.x == 2*deviceWidth){ //  tab = 'ladybug';  
                this.tab = 'ladybug';
                this.refs['session-list'].selectItem(this.props.data.protocole=='flash' ? 0 : false);
                this.refs['insect-list'].refresh();
              }
            }}
          )}
        >
     
          <View style={{width: Dimensions.get('window').width}}>
            <CollectionForm 
              ref="collection-form"
              data={this.props.data}
              valueChanged={(key,val) => this.collectionChanged(key,val)}
// on load
            />
          </View>

          <View style={{width: Dimensions.get('window').width}}>
            <AdvancedList
              ref="session-list"
              localStorage = {this.props.data.date + "_sessions"}
              renderListItem = {(value, index) => this.renderSessionListItem(value, index)}
              renderDetailedItem = {(data, index) => this.renderSessionForm(data, index)}

              editing = {this.props.data.protocole=='flash' ? 0 : false}
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
              deleteItem = {(data, index)=> this.deleteSession(data, index)}
              onLoad={(items)=> this.areValidItems('calendar-clock',items)}
            />
          </View>

          <View style={{width: Dimensions.get('window').width}}>
            <AdvancedList
              key="insect-list"
              ref="insect-list"
              localStorage = {this.props.data.date + "_insects"}
              renderListItem = {(value, index) => this.renderInsectListItem(value, index)}
              renderDetailedItem = {(data, index) => this.renderInsectForm(data, index)}
              
              // newItem = {(index) => {}} // we create new insect here only by extrxting a photo.
              newItemContent = {false} 
              // Display list after photo extracted.
              newItemCallBack = {(data, index) => this.refs['insect-list'].selectItem(false) }

              deleteItem = {(data, index) => this.deleteInsect(data, index)}
              onLoad={(items)=> this.areValidItems('ladybug', items)}
              mergeItems={(mergedItems, originalItem)=>this.mergeInsects(mergedItems, originalItem)}
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


    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {

      if (Array.isArray(this.refs['collections'].state.selectedItems)){
        this.refs['collections'].selectedItems(false);
        return true;   
      }
      else {
        Alert.alert(
          "Quiter l'application ?",
          "",
          [{
            text: 'Annuler',
            // onPress: () => {return false},
          },{
            text: 'Quitter', 
            onPress: () =>{BackHandler.exitApp()},
          }]
        );
        return true;
      }
    });
  }

  componentWillUnmount(){
    this.backHandler.remove();
  }

  newCollection(){
    const now = date2folderName();

    // Create stored data.
    AsyncStorage.setItem(now+'_collection', JSON.stringify({
      storage:{type:null, path:null},
      published:false,
      name:null,
      protocole:null,

      place:{
        lat:null,
        long:null,
        name:null
      }, 

      flower:{
        photo:null,
        id_flower_unknown:null,
        taxon_list_id_list:null,     // flower:taxa_taxon_list_id_list[]
        taxon_name:null,                // just for display on app.
        taxon_extra_info:null,
        comment:null,
      },

      environment:{
        photo:'',
        occAttr_3_1528533:null,      //  spontanée, plantée occAttr:3:1528533
        locAttr_2:null,     // NOT MANDATORY            //  ruche
        locAttr_1:[],   // NOT MANDATORY              //  habitat
        locAttr_3:null,                 //  grande culture en fleur
      },
    }));

    // Return data required for list.
    return {
      storage:{type:null, path:null},
      name:null,
      protocole:null,
      place:{lat:null, long:null, name:null},
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
    // console.log(value);
    const color = value.published 
      ? 'grey'
      : value.status_flower && value.status_sessions && value.status_insects 
      ? colors.greenFlash : colors.purple;

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
            // TODO: number of insects & sessions
            // and insect photo?
            name={ value.protocole == 'flash' 
            ? 'flash-outline' 
            : value.protocole == 'long' 
              ? 'timer-sand'
              : 'help-circle-outline'
            }
            style={[styles.listItemText,{
              color:color,
              margin:0,
              marginTop:5,
              }]}
            size={18}
          />

          {/* !this.state.hasRemovalStorage ? null :
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
                color:color,
                }]}
              size={18}
            />
          */}

          <Text style={[styles.listItemText, {fontWeight:'bold', fontSize:18, color:color,}]}>
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
    paddingLeft:15,
    marginTop:5, marginBottom:5,
    marginLeft:0,
    marginRight:0,
    height:55,
    fontSize:18,
    textAlign:'center',
    backgroundColor:'white',
    // borderColor:colors.greenFlash,
    // borderWidth:1,
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
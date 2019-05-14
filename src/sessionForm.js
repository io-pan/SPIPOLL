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
} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import RNFetchBlob from 'rn-fetch-blob';

import FooterImage from './footerimage';
import AdvancedList from './advancedList';
import { Form, checkForm, Timer, ImagePicker} from './widgets.js';
import { colors } from './colors';
import { formatDate, formatTime, date2folderName} from './formatHelpers.js';
import Cam from './cam';
const  flashSessionDuration = 20*60;

//-----------------------------------------------------------------------------------------
export default class SessionForm extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props, ctx) {
    super(props, ctx);

    this.form = { session: [
        {
          name:'smpAttr_24',
          type:'singleSelect',
          title:'Couverture nuageuse',
          values: [ 
            {label:'0-25%',   value:123},
            {label:'25-50%',  value:124},
            {label:'50-75%',  value:125},
            {label:'75-100%', value:126},
          ],
      
        },{
          name:'smpAttr_25',
          type:'singleSelect',
          title:'Température',
          values: [ 
            {label:'< 10ºC',  value:127},
            {label:'10-20ºC', value:128},
            {label:'20-30ºC', value:129},
            {label:'>30ºC',   value:130},
          ],
      
        },{
          name:'smpAttr_26',
          type:'singleSelect',
          title:'Vent',
          values: [ 
            {label:'Nul',                 value:131},
            {label:'Faible, irrégulier',  value:132},
            {label:'Faible, continu',     value:133},
            {label:'Fort, irrégulier',    value:134},
            {label:'Fort, continu',       value:135},
          ],
      
        },{
          name:'smpAttr_27',
          type:'singleSelect',
          title:'Fleur à l\'ombre',
          values: [ 
            {label:'Oui', value:1 },
            {label:'Non', value:0 },
          ],
        }
      ]
    };

    this.state = {
      remainingTime:false,
      isDateTimeVisible:false,
      isTimePickerVisible:false,
      isDatePickerVisible:false,
      session:{...props.data,
        date: props.data.date ? props.data.date : null,
        time_start: props.data.time_start ? props.data.time_start : null,
        time_end: props.data.time_end ? props.data.time_end : null,
      },
      // session:{
      //   date:'', //yyyy-mm-dd //id:cc-3-session-date-1 , cc-3-session-date-2   
      //   time_start:'',    // hh:mm //smpAttr:22
      //   time_end:'',      // hh:mm //smpAttr:23
      //   smpAttr_24:'',    // couverture nuageuse
      //   smpAttr_25:'',    // températuere
      //   smpAttr_26:'',          // vent
      //   shadow:'',
      // },
    };
  }


  sessionStatus(){
    let status = false;
    if(this.isSessionOver()){
      status = 'over';
    }
    else if(this.isSessionRunning()){
      status = 'running';
    }
    else if(this.isSessionScheduled()){
      status = 'scheduled';
    }
    else {
      status = 'unset';
    }

    // console.log('SESSION status', status);
    // console.log('  now:' + new Date());
    // console.log('  deb:' + new Date( this.state.session.time_start))
    // console.log('  fin:' + new Date( this.state.session.time_end))

    return status;
  }

  isSessionRunning(){
    if(this.state.session.date && this.state.session.time_start){
      const now = new Date();
      // now.setMilliseconds(0);
      // now.setSeconds(0);

      isSessionRunning = 
      !this.state.session.time_end 
      ? now.getTime() >= this.state.session.time_start
      : now.getTime() >= this.state.session.time_start 
        && now.getTime() < this.state.session.time_end
      ;

      // console.log('isSessionRunning',isSessionRunning);
      return isSessionRunning;
    }
    return false;
  }

  isSessionOver(){
    // console.log('isSessionOver');
    if(this.state.session.date && this.state.session.time_end){
      const now = new Date();
      // now.setMilliseconds(0);
      // now.setSeconds(0);

      // const end = new Date(this.state.session.time_end);
      // end.setSeconds(0);
      // end.setMilliseconds(0);

      isSessionOver = now.getTime() >= this.state.session.time_end;

      return isSessionOver;
    }
    return false;
  }

  isSessionScheduled(){
    // console.log('isSessionScheduled');

    if (this.state.session.date && this.state.session.time_start
    && (this.props.protocole=='flash' || this.state.session.time_end)){

      const now = new Date();
    //     now.setMilliseconds(0);
    // now.setSeconds(0);

            isSessionScheduled = now.getTime() < this.state.session.time_start;

      // console.log(isSessionScheduled)
      return isSessionScheduled;
    }
    return false;
  }

  _showDateTime(value) { 
    let now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    now = now.getTime();

    this.setState({ 
      isDateTimeVisible: value,
      // session:{
      //   ...this.state.session, 
      //   date:now,
      // }
    }, function(){
      this.storeSession('date', now);
    }) 
  };

  _showTimePicker = (field) => {
    if(!this.state.session.date){
      this._showDatePicker();
    }
    else{
      if (field == 'start' || !this.state.session.time_start){
        const start = new Date();
        this.initialTimeStart =  new Date(start.getTime() + 60000);
      }
      else {
        this.initialTimeEnd = new Date( this.state.session.time_start + ((flashSessionDuration+1)*1000));
      }
      this.setState({ isTimePickerVisible: field });
    }
  };

  _showDatePicker = () => { 
    this.initialDate = new Date();
    this.setState({ isDatePickerVisible: true })
  };

  _hideDateTimePicker = () => this.setState({ isTimePickerVisible: false, isDatePickerVisible:false });

  _handleDatePicked(date){
    date = date.getTime();

    let now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    now = now.getTime();

    let day3 = new Date();
    day3.setHours(0);
    day3.setMinutes(0);
    day3.setSeconds(0);
    day3.setMilliseconds(0);
    day3 = day3.getTime();
    day3 += 24*3 *60*60 * 1000;

    if(date >= now && date < day3){
      this.storeSession('date', date);
    }
    else{
      Alert.alert('Date invalide', 'Lancez la session ou programmez la dans les 3 jours à venir.'
      );
      this.setState({session:{...this.state.session,date:''}});
    }
    this._hideDateTimePicker();
  };

  _handleTimePicked = (time) => {
    now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    session_date = new Date(this.state.session.date);
    time = new Date(
      session_date.getFullYear(),
      session_date.getMonth(),
      session_date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0,
    );
    time = time.getTime();

    // Check time validity.
    if(time > now){
    
      if((this.state.isTimePickerVisible=='end'  
          && (!this.state.session.time_start || time > flashSessionDuration*1000 + this.state.session.time_start))
      || (this.state.isTimePickerVisible=='start' 
          && (!this.state.session.time_end   || time+flashSessionDuration*1000 < this.state.session.time_end))
      ){
        this.storeSession('time_'+this.state.isTimePickerVisible, time);
      }
      else {
        Alert.alert("la session doit durer plus de 20 minutes.");
        this.setState({
          session:{...this.state.session, ['time_'+this.state.isTimePickerVisible] : ''},
          isTimePickerVisible:false,
        });;
      }  
    }
    else{
      Alert.alert('Heure passée.');
      this.setState({
        session:{...this.state.session, ['time_'+this.state.isTimePickerVisible] : ''},
        isTimePickerVisible:false,
      });
    }
  };

  launchSession(){
    // if(!this.state.session.date){
      let now = new Date();
      now.setMilliseconds(0);
      now = now.getTime();

      let end = this.state.session.time_end; 
      if(this.props.protocole=='flash'){
        end = now + flashSessionDuration * 1000;
      }


      this.setState({
        session:{
          ...this.state.session,
          date:now,
          time_start:now,
          time_end:end,
        }
      }, function(){
        // TODO: check if really needed
        this.props.valueChanged('date', now);
        this.props.valueChanged('time_start', now);
        this.props.valueChanged('time_end', end);
      });
    // }
  }

  cancelSession(){
    Alert.alert(
      'Annuler la session ?',
      "Si vous annulez la session, les espèces d'insectes associées seront définitivement perdues.",
      [
        {
          text: 'Poursuivre la session',
          onPress: () => {}
        },
        {
          text: 'Annuler la session', 
          onPress: () => {
            this.reallyCancelSession();
          }
        },
      ],
    );     
  }

  reallyCancelSession(){
    // Delete insects & photos attached to that session
    // ... unless we cancel a scheduled session (while form is not output yet)
    if(this.refs['running-insect-list']){
      let toBeDeleted = [];
      const insects = this.refs['running-insect-list'].state.items;

      for(i=0; i<insects.length; i++){
        // console.log(insects[i].session)
        if(insects[i].session == this.state.session.date + '_' + this.state.session.time_start){
          toBeDeleted.push(i);
        }
      }
      if(toBeDeleted.length){
        this.refs['running-insect-list'].deleteItems(toBeDeleted); 
      }
    }

    // Reset session.
    this.setState({
      isDateTimeVisible:false,
      session:{
      ...this.state.session,
        date:null,
        time_start:null,
        time_end:null,
      }
    })
    // TODO make multiValueChange
    this.props.valueChanged('date',null);
    this.props.valueChanged('time_start',null);
    this.props.valueChanged('time_end', null);
  }

  stopSession(){
    const now = new Date();
    // console.log(now)
    // console.log(now.getTime());
    // console.log()

    // console.log(new Date(this.state.session.time_start))
    // console.log(this.state.session.time_start);
    // console.log()

    // console.log(this.state.session.time_start + (flashSessionDuration+60)*1000)


    if(now.getTime() < this.state.session.time_start + (flashSessionDuration+60)*1000){
      Alert.alert(
        'Annuler la session ?',
        "La session doit durer plus de 20 minutes. \n"
         + "Si vous l'annulez, toutes les photos associées seront définitivement perdues.",
        [
          {
            text: 'Poursuivre la session',
            onPress: () => {

            }
          },
          {
            text: 'Annuler la session', 
            onPress: () => {
              this.reallyCancelSession();
            }
          },
        ],
      );
    }
    else {
      this.closeSession(now);
    }
  }

  closeSession(date){
    date.setSeconds(0); // .setSeconds(now.getSeconds()-1);
    date.setMilliseconds(0);

    this.refs['running-timer'].clear();
    this.setState({
      isDateTimeVisible:false,
      session:{
      ...this.state.session,
        time_end: date.getTime(),
      }
    })
    this.props.valueChanged('time_end', date.getTime());
  }

  storeSession(field, value){
    this.setState({
      isTimePickerVisible:false,

      session:{ // TODO: this shoud not be needed.
        ...this.state.session,
        [field]:value,
      }
    },function(){
      // Store list.
      // const sessionValid = checkForm(this.form.session, this.state.session);
      this.props.valueChanged(field, value);
    });
  }


  newInsect(index){
    // RUNNING SESSION
    const now = date2folderName(),
          folderName = this.props.collection_storage + '/insects/' + now;

    // Create insect photos folder.
    RNFetchBlob.fs.mkdir(folderName)
    .then(() => { 
      // console.log('insct folder created ' + folderName ) 
    })
    .catch((err) => { 
      Alert.alert(
        'Erreur',
        'Le dossier de stockage des photos n\'a pu être créé.\n'
        + folderName
      );
    })

    // Return default data.
    return {
      taxon_list_id_list:null,
      taxon_name:null,
      comment:null,
      session:this.props.data.date + '_' + this.props.data.time_start, // + '_' + this.props.data.time_end,
      photo:null,
      date:now, // So we now in which folder photos are. 

      occAttr_4:null, // Nombre maximum d'individu
      occAttr_5:null, //Insecte photographié sur la fleu
    };
  }

  renderInsectForm(data, index){ 
    // Just launch cam from image picker.
    return null;
  }

  renderInsectListItem(value, index){ 
    // RUNNING SESSION
    console.log('renderInsectListItem ' + index, value)

// TODO do not remove lower until session ends.
    // For field "how many in insect did you see at once ?"
    //  behave a bit different here.
    const vals = [
        {label:' 1 ',           value:123},
        {label:'entre 2 et 5',  value:124},
        {label:'plus de 5',     value:125},
    ];
    let formFields = [{
      name:'occAttr_4',
      type:'singleSelect',
      title:'Nombre maximum d\'individus de cette espèce vus simultanément',
      values: [],
    }];
    
    // Let user choose between all values... 
    if(!value.occAttr_4 || value.occAttr_4==126 //.. if value not set
    || value.session == this.state.session.date + '_' + this.state.session.time_start ){ // or insect has been create on current session.
      
      formFields[0].values = vals;
      formFields[0].values.push({label:'Ne sais pas', value:126});
    }
    else{
      // Let user choose only between current and greater values.
      for(i=0; i<vals.length; i++){
        if(value.occAttr_4 <= vals[i].value){
          formFields[0].values.push(vals[i]);
        }
      }
    }

    return(
      <View style={[styles.collection_grp, {flex:1, borderWidth:1, borderColor:'lightgrey', marginLeft:10,marginRight:10,}]}>
        <ImagePicker
          ref={'image-picker'+index}
          // key="runniing-session-insect"
          title={ value.taxon_extra_info 
            ? value.taxon_extra_info 
            : value.taxon_name ? value.taxon_name 
            : 'Espèce ' + (index+1) + ' - Non identifiée' 
          }
          cam = {true}
// TODO
//           extractPhotos={(paths) => this.props.extractPhotos(paths, this.state.insect.session)}
          styles={{
            highlightColor:colors.greenFlash,
            badColor:colors.purple,
            title:{fontSize:16, fontWeight:'bold', height:50, textAlign:'center',  padding:2},
            container:{marginRight:5, flex:1, padding:5,
             // borderWidth:1, borderColor:'lightgrey', backgroundColor:'white'
           }
          }}

          // path={this.props.collection_storage + '/insects/' + this.props.data.date }
          path={this.props.collection_storage + '/insects/' + value.date}
          filename={value.photo}
          onSelect={(filename)=>{
            console.log(filename);
            this.refs['running-insect-list'].storeItemField('photo', filename, index);
          }}
        />
        {/*
          !value.session ? null :
          <Text style={{fontSize:16}}>
            Session 
            de {formatTime(parseInt(value.session.split('_')[1]),10)}
            <Text  style={{fontSize:14}}> le {formatDate(parseInt(value.session.split('_')[0]))}</Text>
          </Text>
        */}
        <Form
          fields={formFields}
          currentValues={value}
          fieldChanged={(field, value) => this.refs['running-insect-list'].storeItemField(field, value, index) }
          // style={styles.collection_subgrp}
          styles={{
            group:{},//styles.collection_subgrp,
            title:styles.coll_subtitle,
            label:{backgroundColor:'white', borderWidth:1, margin:5, padding:5, borderColor:colors.greenFlash},
            labelText:{fontSize:14, backgroundColor:'white'}, 
            highlightColor:colors.greenFlash,
            badColor:colors.purple,
          }}
        />

      </View>

    );
  }

  deleteInsectFolder(data) {
    // Delete photos folder.
    const folder = this.props.collection_storage + '/insects/' + data.date;
    RNFetchBlob.fs.unlink(folder)
    .then(() => { 
      console.log('insect folder deleted ' + folder)
    })
    .catch((err) => {
      Alert.alert(
        'Erreur',
        'Le dossier contenant les photos n\'a pu être supprimé.\n'
        + folder
      );
    }); 
  }

  renderRunningForm(sessionStatus){
    return(
      <Modal
        visible={true}
        onRequestClose={() => this.stopSession()}
        // style={{ justifyContent:'center', textAlign:'center',}} 
        >

        { this.renderLaunchButton(sessionStatus)}

        <Text style={{marginTop:20, marginBottom:10, textAlign:'center', 
          fontSize:16, fontWeight:'bold'}} >
        Espèces déjà vues</Text>

        <AdvancedList
          ref="running-insect-list"
          localStorage = {this.props.collection_id + "_insects"}
          renderListItem = {(value, index) => this.renderInsectListItem(value, index)}
          // renderDetailedItem = {(data, index) => this.renderInsectForm(data, index)}
          selectItemAltFunction={(index)=> {
            this.refs['running-insect-list'].refs['image-picker'+index].refs['button'].touchableHandlePress();
          }}
          newItem = {(index) => this.newInsect(index)}
          newItemContent = {
            <View style={{backgroundColor:colors.greenFlash, flexDirection:'row', alignItems:'center', justifyContent:'center', height:50}}
              >
              <MaterialCommunityIcons   
                name='camera' // 'plus-circle-outline'
                style={{fontSize:25, paddingRight:10, color:'white'}}
              />
              <Text style={{color: 'white', fontSize:18, fontWeight:'bold'}}>
               Nouvelle espèce d'insecte</Text>
            </View>
          }

          deleteItem = {(data, index) => this.deleteInsectFolder(data, index)}
        />

      </Modal>
    );
  }


  renderLaunchButton(sessionStatus){

    return(
            sessionStatus == 'scheduled'
            ? <View style={{
                height:55,
                flexDirection:'row',
                justifyContent:'center', alignItems:'center',
                backgroundColor:colors.greenFlash, 
                borderTopWidth:1, borderTopColor:'white',
                }}>

                <View
                  style={{backgroundColor:colors.greenFlash, padding:0, flexDirection:'row', 
                    justifyContent:'center', alignItems:'center',
                    borderRightWidth:1, borderRightColor:'white',
                    flex:1,
                  }}
                  >
                  <MaterialCommunityIcons
                    name="alarm" 
                    style={{color:'white', padding:10, backgroundColor:'transparent'}}
                    size={25}
                    backgroundColor = 'transparent'
                  />
                  <View>
                    <Text style={{color:'white', fontSize:10}}>Lancement dans</Text>
                    <Timer
                      key="scheduling-timer"
                      ref="scheduling-timer"
                      style={{textAlign:'center', fontWeight:'bold', fontSize:18, color:'white'}}
                      onTimeout={() => this.launchSession()}
                      time={this.state.session.time_start}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={{padding:0, flexDirection:'row', justifyContent:'center', alignItems:'center',
                    backgroundColor:  colors.greenFlash,
                    borderWidth: 1, borderColor: colors.greenFlash,
                  }}
                  onPress = {() => this.reallyCancelSession()}
                  >
                  <MaterialCommunityIcons
                    name="close-circle" 
                    style={{paddingLeft:15, paddingRight:15, backgroundColor:'transparent',
                      color: 'white',}}
                    size={30}
                    backgroundColor = 'transparent'
                  />
                </TouchableOpacity>
              </View>


            : sessionStatus == 'running' ?

              <View style={[{height:55, margin:0, 
                  // borderTopWidth:1, borderTopColor:'white'
                  }]}>
                  <View style={{height:55, backgroundColor:colors.greenFlash, flexDirection:'row',
                            justifyContent:'center', alignItems:'center',}}>
                    <View
                      style={{backgroundColor:colors.greenFlash, padding:0, flexDirection:'row', 
                        justifyContent:'center', alignItems:'center',
                        borderRightWidth:1, borderRightColor:'white',
                        flex:1,
                      }}
                      >
                      <MaterialCommunityIcons
                        name="play-circle-outline" 
                        style={{color:'white', padding:10, backgroundColor:'transparent'}}
                        size={25}
                        backgroundColor = 'transparent'
                      />
                      <Timer
                        key="running-timer"
                        ref="running-timer"
                        style={{textAlign:'center', padding:10, fontWeight:'bold', fontSize:18, color:'white'}}
                        onTimeout={()=>{alert('Session over TODO:setstate to refresh')}}
                        time={
                          this.state.session.time_end
                          ? this.state.session.time_end // has been set to start + 20min for flash protocole.
                          : this.state.session.time_start
                        }
                      />
                    </View>

                    <TouchableOpacity
                      style={{padding:0, flexDirection:'row', justifyContent:'center', alignItems:'center',
                        backgroundColor:  colors.greenFlash,
                        borderWidth: 1, borderColor: colors.greenFlash,
                      }}
                      onPress = {this.props.protocole=="flash"
                        ? () => this.cancelSession()
                        // : now.getTime() < this.state.session.time_start + (flashSessionDuration+60)*1000
                        //   ? () => this.cancelSession()
                          : () => this.stopSession()
                      }
                      >

                      <MaterialCommunityIcons
                        name={ 
                          this.props.protocole=="flash"
                          ? "close-circle" 
                          // : now.getTime() < this.state.session.time_start + (flashSessionDuration+60)*1000
                          //   ? "close-circle"
                            : "stop-circle"
                        }
                        style={{paddingLeft:15, paddingRight:15, backgroundColor:'transparent',
                          color: 'white',}}
                        size={30}
                        backgroundColor = 'transparent'
                      />
                    </TouchableOpacity>
                  </View>
              </View>

            : sessionStatus == 'over' ? null

            : sessionStatus != 'unset' 
              ? null 
              : !this.state.isDateTimeVisible
                ?
                  <View style={{
                    flexDirection:'row',
                    justifyContent:'center', alignItems:'center',
                    backgroundColor:colors.greenFlash, 
                    borderTopWidth:1, borderTopColor:'white',
                    }}>

                    <TouchableOpacity
                      style={{padding:0, flexDirection:'row', 
                        height:55,
                        justifyContent:'center', alignItems:'center',
                        borderRightWidth:1, borderRightColor:'white',
                        flex:1,
                      }}
                      onPress = {() => this.launchSession()}
                      >
                      <MaterialCommunityIcons
                        name="play-circle-outline" 
                        style={{color:'white', padding:10, backgroundColor:'transparent'}}
                        size={30}
                        backgroundColor = 'transparent'
                      />
                      <Text style={{textAlign:'center', padding:10, fontWeight:'bold', 
                        fontSize:18, color:'white'}}>
                      Lancer la session</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{padding:0, flexDirection:'row', justifyContent:'center', alignItems:'center',
                        backgroundColor:  colors.greenFlash,
                        borderWidth: 1, borderColor: colors.greenFlash,
                      }}
                      onPress = {() => this._showDateTime(!this.state.isDateTimeVisible)}
                      >
                      <MaterialCommunityIcons
                        name="alarm" 
                        style={{paddingLeft:15, paddingRight:15, backgroundColor:'transparent',
                          color: 'white',}}
                        size={30}
                        backgroundColor = 'transparent'
                      />
                    </TouchableOpacity>
                  </View>
                : 
                  <View>
                    <View style={{flexDirection:'row'}}>
                      <View
                        style={{backgroundColor:colors.greenFlash, padding:0, 
                          flexDirection:'row', 
                          justifyContent:'center', alignItems:'center',
                          borderRightWidth:1, borderRightColor:'white',
                          flex:1,
                          height:55,
                        }}
                        >
                        <Text style={{textAlign:'center', padding:10, 
                          fontWeight:'bold', fontSize:18, color:'white'}}>
                        Lancement planifié 
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{padding:0, flexDirection:'row', 
                          justifyContent:'center', alignItems:'center',
                          backgroundColor:  colors.greenFlash,
                          borderWidth: 1, borderColor: colors.greenFlash,
                        }}
                        onPress = {() => this._showDateTime(!this.state.isDateTimeVisible)}
                        >
                        <MaterialCommunityIcons
                          name="close-circle" 
                          style={{paddingLeft:15, paddingRight:15, backgroundColor:'transparent',
                            color: 'white',}}
                          size={30}
                          backgroundColor = 'transparent'
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.collection_subgrp, {
                      marginTop:0,marginBottom:0, borderTopWidth:0}]}>
                      {/*
                      <Text style={styles.coll_subtitle}>
                      Date, Heure de début { this.props.protocole=='flash' ? '' : 'et de fin'}</Text>
                      */}
                      <View style={{
                        flexDirection:'row',
                        alignItems:'space-between',
                        justifyContent:'center',
                      }}>
                        <TouchableOpacity
                          style={{alignSelf:'flex-start',
                          backgroundColor:'white', borderWidth:1, margin:5, padding:5,
                            borderColor:colors.greenFlash, flex:0.6,
                          }}
                          onPress={this._showDatePicker}
                          >
                          <Text style={{fontSize:14,backgroundColor:'white', textAlign:'center',
                            // color: this.state.collection.environment.occAttr_3_1528533==108 ? colors.greenFlash : 'grey',
                            }}>
                            { this.state.session.date
                              ? formatDate(this.state.session.date)
                              : 'Date'
                            }
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                            borderColor:colors.greenFlash, flex: 0.2,
                          }}
                          onPress = {() => this._showTimePicker('start')}
                          >
                          <Text style={{fontSize:14, textAlign:'center',
                            // color: this.state.collection.environment.occAttr_3_1528533==109 ? colors.greenFlash : 'grey',
                          }}>
                          { this.state.session.time_start
                            ? formatTime(this.state.session.time_start) 
                            : 'Début'
                          }
                          </Text>
                        </TouchableOpacity>

                        { this.props.protocole=='flash' ? null :
                        <TouchableOpacity
                          style={{backgroundColor:'white', borderWidth:1,margin:5, padding:5,
                            borderColor:colors.greenFlash, flex:0.2,
                          }}
                          onPress = {() => this._showTimePicker('end')}
                          >
                          <Text style={{fontSize:14, textAlign:'center',
                            // color: this.state.collection.environment.occAttr_3_1528533==110 ? colors.greenFlash : 'grey',
                          }}>
                            { this.state.session.time_end
                              ? formatTime(this.state.session.time_end) 
                              : 'Fin'
                            }
                          </Text>
                        </TouchableOpacity>
                        }
                      </View>
                    </View>
      
                    <DateTimePicker
                      date = { this.initialDate }
                      isVisible={this.state.isDatePickerVisible}
                      onConfirm={(date) => this._handleDatePicked(date)}
                      onCancel={this._hideDateTimePicker}
                    />

                    <DateTimePicker
                      mode="time"
                      date = { this.state.isTimePickerVisible == 'start'
                        ? this.initialTimeStart : this.initialTimeEnd
                      }
                      isVisible={this.state.isTimePickerVisible!=false}
                      onConfirm={this._handleTimePicked}
                      onCancel={this._hideDateTimePicker}
                    />
                </View>
              
    );
  }

  render(){
    console.log('render SessionForm', this.state);

    // Check form validity.
    const sessionValid = checkForm(this.form.session, this.state.session);

    const sessionStatus = this.sessionStatus();
    return(
      <View  style={{flex:1}}>

      { sessionStatus == 'running'
      ? this.renderRunningForm(sessionStatus)
      :
        <View style={{flex:1}}>
          <View  style={{flex:1}}>
            <ScrollView>
              <View style={styles.collection_grp}>

                {  sessionStatus != 'over' ? null :
                <View 
                  style={{flexDirection:'row', flex:1, justifyContent:'center', marginBottom:20,}}
                  // onPress = {() => this.help('Protocole')} 
                  >
                  <Text style={{
                    fontSize:18, fontWeight:'bold',/* flex:1, textAlign:'center',*/ 
                    padding:5, 
                    color: sessionValid ? colors.greenFlash : colors.purple,
                    backgroundColor:'transparent'
                    }}>
                      {formatDate(this.state.session.date)}  {formatTime(this.state.session.time_start)}  -  {formatTime(this.state.session.time_end)}
                  </Text>
                </View>
                }

                <Form
                  // localStorage = {this.props.localStorage}
                  fields={this.form.session}
                  currentValues={this.state.session}
                  fieldChanged={(field, value) => this.storeSession(field, value)}
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
          </View>
          { this.renderLaunchButton(sessionStatus)}
        </View>
        }
      </View>
    )
  }
} // SessionForm


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
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  AsyncStorage,
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
} from 'react-native'

import {
  Button,
  CheckBox,
  ListItem,
} from 'react-native-elements';
import ImageView from './imageView';
import ModalFilterPicker from './filterSelect';
import RNFetchBlob from 'rn-fetch-blob';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Spipoll
import { flowerList } from './flowers.js';
const greenDark = "#231f20";
const green = "#d2e284";
const greenLight = "#e0ecb2";
const greenSuperLight ="#ecf3cd"
const greenFlash ="#92c83e";


//-----------------------------------------------------------------------------------------
export default class SpipollLoginFrom extends Component {
//-----------------------------------------------------------------------------------------
  constructor (props) {
    super(props)

    this.hasCred = false;
    this.state = {
      connected: false,
      name:'',
      pass:'',
    };
  }

  componentDidMount() {

    let name ='',
        pass ='';
    AsyncStorage.getItem('cred', (err, cred) => {
      if (err) {
        // Alert.alert('ERROR getting locations'+ JSON.stringify(err));
      }
      else {
        if(cred){
          cred = JSON.parse(cred);
          name=cred.name;
          pass=cred.pass;
          if(name&& pass){
            this.setState({
              name:name,
              pass:pass,
            }, function(){
              this.login(this.treatlog);
            })
          }
        }
      }
    })
  }


  treatlog = (connected) => {
    console.log('connected',connected);
    this.setState({connected:connected})
    if(connected){
      AsyncStorage.setItem('cred', JSON.stringify({
        name:this.state.name,
        pass:this.state.pass,
      }));

      return;

      // Submit data.

      // var callback = callback;
      var data = new FormData();
      data.append("locations_website", "2");
      data.append("website_id", "2");

      data.append("location:centroid_sref", "0, 0");
      data.append("location:centroid_geom", "POINT(0 -7.08115455161362e-10)");
      data.append("location:centroid_sref_system", "900913");
      data.append("location:name", "testapp");
           
      data.append("sample:survey_id", "2");
      data.append("sample:location_name", "testapp");
      data.append("sample:date", "2010-01-01");

      data.append("smpAttr:21", "106");
      data.append("smpAttr:20", "0");
      data.append("smpAttr:18", "56810");
      data.append("smpAttr:8" , "lionel.rousseau@iopan.net");
      data.append("smpAttr:19", "ioPan");

      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;

      xhr.onreadystatechange = function() {
        console.log(xhr);
        if (xhr.readyState === 4) {
          if (xhr.status === 200){
            console.log(xhr.response);
            // callback();
            //_response: "{error:"iform_ajaxproxy Error: Indicia website_id not provided in POST."}"

          }
          else{
            Alert.alert('Submission error');
            // callback(false);
          }
        }
      }

      xhr.open("POST", "http://www.spipoll.org/ajaxproxy?node=50&index=loc-sample");
      xhr.setRequestHeader("cache-control", "no-cache");
      xhr.send(data);


    }
    // Connection failed.
    else { 
      AsyncStorage.setItem('cred', '');  
    }    
  }

  login(callback){

        fetch('http://www.spipoll.org/mon-spipoll/creer-une-collection?login_popup=', {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name:this.state.name,
            pass: this.state.pass,
            form_id: "user_login"
          }),
        })
        // .then((response) => response.json())
        .then((responseJson) => {
          console.log(responseJson);
            if (responseJson.status ===200
            && responseJson._bodyInit.indexOf("Créer une collection")
            ){
              callback(true);//
            }
            else{
              callback(false);
            }
      
        })
        .catch((error) => {
          console.error(error);
        });
  }

  // loginXHR(callback){
  //   var callback = callback;

  //   var data = new FormData();
  //   data.append("name", this.state.name);
  //   data.append("pass", this.state.pass);
  //   data.append("form_id", "user_login");

  //   var xhr = new XMLHttpRequest();
  //   xhr.withCredentials = true;

  //   xhr.onreadystatechange = function() {
  //     if (xhr.readyState === 4) {
  //       if (xhr.status === 200
  //       && xhr.responseText.indexOf("Se Connecter") < 0){
          
  //       }
  //       else{
  //         Alert.alert('Connection error');
  //         callback(false);
  //       }
  //     }
  //   }

  //   xhr.open("POST", "http://www.spipoll.org/mon-spipoll/creer-une-collection?login_popup=");
  //   xhr.setRequestHeader("cache-control", "no-cache");
  //   xhr.send(data);
  // }

  logout(){
    this.setState({connected:false});
    AsyncStorage.setItem('cred', ''); 
  }

  onInput(k,v){
    this.setState({[k]:v})
  }

  render () {
    return (
      <View style={styles.collection}>
        
        {!this.state.connected
        ? <View style={styles.collection_grp}>
            <Text style={styles.coll_title}>LOGIN</Text>
            <TextInput
              placeholder='Identifiant'
              autoCapitalize="none"
              style={styles.collection_input_text}
              defaultValue={this.state.name}
              onEndEditing =    {(event) => this.onInput( 'name',event.nativeEvent.text) } 
              onSubmitEditing = {(event) => this.onInput( 'name',event.nativeEvent.text) } 
            />
            <TextInput
              placeholder='Mot de passe'
              defaultValue={this.state.pass}
              autoCapitalize="none"
              secureTextEntry={true}
              style={styles.collection_input_text}
              onEndEditing =    {(event) => this.onInput( 'pass',event.nativeEvent.text) } 
              onSubmitEditing = {(event) => this.onInput( 'pass',event.nativeEvent.text) } 
            />

            <TouchableOpacity 
              style={styles.buttonContainer} 
              onPress = {() => this.login(this.treatlog)}
              >
              <Text>Connection</Text>
            </TouchableOpacity> 
          </View>
        :
          <View style={styles.collection_grp}>
            <TouchableOpacity 
              style={styles.buttonContainer} 
              onPress = {() => this.logout()}
              >
              <Text>Déconnection</Text>
            </TouchableOpacity> 
          </View>
        }


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
    margin:5,
    padding:5,
    fontWeight:'normal',
    fontSize:16,
    color:greenDark,
    backgroundColor:'white',
  },
  row:{
    flexDirection:'row', 
  }
});
import React, { Component } from 'react'
import PropTypes from 'prop-types'
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
    this.state = {
      connected: false,
    };

    this.id='ioPan';
    this.pass='B3ssiere.3';
    // this.form_build_id='';
  }


treatlog = (connected) => {
  this.setState({connected:connected})
}

login(callback){
  var callback = callback;

  var data = new FormData();
  data.append("name", "xxx");
  data.append("pass", "xxx");
  data.append("form_id", "user_login");

  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200
      && xhr.responseText.indexOf("Se Connecter") < 0){
        callback(true);
      }
      else{
        Alert.alert('Connection error');
        callback(false);
      }
    }
  }

  xhr.open("POST", "http://www.spipoll.org/mon-spipoll/mon-spipoll?login_popup=");
  xhr.setRequestHeader("cache-control", "no-cache");
  xhr.send(data);
}



  render () {
    return (
      <View style={styles.collection}>
        
        {!this.state.connected
        ? <View style={styles.collection_grp}>
            <Text style={styles.coll_title}>LOGIN</Text>
            <TextInput
              style={styles.collection_input_text}
              placeholder='Identifiant'
            />
            <TextInput
              style={styles.collection_input_text}
              placeholder='Mot de passe'
            />

            <TouchableOpacity 
              style={styles.buttonContainer} 
              onPress={this.login(this.treatlog)}
              >
              <Text>Connection</Text>
            </TouchableOpacity> 
          </View>
        :
          <View style={styles.collection_grp}>
            <Text>CONNECTÉ</Text>
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
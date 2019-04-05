import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  BackHandler,
  ScrollView,
  AsyncStorage,
} from 'react-native'

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors} from './colors';
import FooterImage from './footerimage';


// TODO: collection date should retrieve earlier session date.

//=========================================================================================
export default class AdvancedList extends Component {
//-----------------------------------------------------------------------------------------
 constructor(props) {
    super(props);
      // localStorage
      // renderListItem
      // renderDetailedItem
      // renderNewItemButton
      // newItem // callback
      // newItemLabel
      // deleteItem

    this.state = {
      items:[],
      editing:false,
      selectItems:false,
    };
    this.editingRequested = false;
  }

  componentWillMount(){
    console.log('AdvancedList storage:', this.props.localStorage)
    AsyncStorage.getItem(this.props.localStorage, (err, items) => {
      if (err) {
        Alert.alert('ERROR getting items ' + this.props.localStorage + ' ' + JSON.stringify(err));
      }
      else {
        if(items){
          console.log('items: ', JSON.parse(items));
          this.setState({
            items:JSON.parse(items),
            editing: this.editingRequested,
          }, function(){
            this.editingRequested = false;
            // console.log(this.props.localStorage, JSON.parse(items));
          });
        }
        else if(this.editingRequested !== false){
          this.newItem();
          this.editingRequested = false;
        }
      }
    });

    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.state.selectItems!==false){
        this.setState({selectItems:false});
      }
      else if (this.state.editing!==false){
        this.setState({editing:false});
      }  
      else if(this.props.backHandler){
        this.props.backHandler();
      }

      return true;      
    });
  }

  componentWillUnmount(){
    this.backHandler.remove();
    BackHandler.removeEventListener('hardwareBackPress', this.backButton);
  }

  newItem(){
    let data = {};

    // Get default data.
    if(this.props.newItem) {
      data = this.props.newItem();
    }

    // Create & store item.
    let items = this.state.items;
    items.push(data);

    this.setState({ 
      items: items,
      editing:items.length-1,
    }, function(){
      AsyncStorage.setItem(this.props.localStorage, JSON.stringify( this.state.items ));
    });
  }

  storeItemField(key, val){
    let items = this.state.items;
    items[this.state.editing][key] = val;
    this.setState({items:items}, function(){
      AsyncStorage.setItem(this.props.localStorage, JSON.stringify( this.state.items ));
    })
  }

  selectItem(index){
    if(this.state.items.length==0){
      this.editingRequested = index;
    }

    else{
      if(this.state.selectItems!==false){
        let selectItems = this.state.selectItems;
        const i = selectItems.indexOf(index);
        if(i<0){
          selectItems.push(index);
        }
        else{
          selectItems.splice(i, 1);
        }
        this.setState({selectItems:selectItems}); 
      }
      else{
        this.setState({editing:index});   
      } 
    }
  }

  selectItems(index) {
    if(index===false){
      this.setState({selectItems:false});
    }
    else {
      this.setState({selectItems:[index]});
    }
  }

  deleteSelected(){
    Alert.alert(
      'Supprimer les éléments sélectionées ?',
      'Toutes les informations et photos associées seront définitivement perdues.',
      [
        {
          text: 'Annuler',
          onPress: () => console.log('Cancel Pressed'),
        },
        {
          text: 'Supprimer', 
          onPress: () => {
            const selected = this.state.selectItems,
                  items = this.state.items;

            // Backward loop to avoid re-index issue.
            for (var i = items.length - 1; i >= 0; i--) {
              if(selected.indexOf(items[i] !== -1)) {
                // Delete folders & co.
                if(this.props.deleteItem) {
                  this.props.deleteItem(items[i]);
                }
                // Remove from list.
                items.splice(i, 1);
              }
            }

            // Store purged list.
            this.setState({
              items:items,
              selectItems:false,
            }, function(){
              AsyncStorage.setItem(this.props.localStorage, JSON.stringify( this.state.items ));
            });
          }
        },
      ],
    );
  }

  render(){
    return(
       <View style={{flex:1}}>
        { this.state.editing === false
          ? <View style={{flex:1}}>

              { this.state.selectItems === false 
              ?
                this.props.newItemLabel ===false ? null :
                <TouchableOpacity  
                  style={{backgroundColor:colors.greenFlash, flexDirection:'row', alignItems:'center', justifyContent:'center', height:50}}
                  onPress = {() => this.newItem()}
                  >
                    <MaterialCommunityIcons   
                      name='plus-circle-outline'
                      style={{fontSize:24, paddingRight:10, color:'white'}}
                    />
                    <Text style={{color: 'white', fontSize:16,}}>
                    {this.props.newItemLabel ? this.props.newItemLabel : 'Ajouter'}</Text>
                </TouchableOpacity>
                
              :
              <View  
                style={{alignItems:'center', backgroundColor:colors.greenFlash,
                 height:50, flexDirection:'row'}}
                >
                <TouchableOpacity style={{flexDirection:'row', flex:0.5, height:50, alignItems:'center', justifyContent:'center',
                 borderRightWidth:1, borderRightColor:'white'}}
                  onPress = {() => this.deleteSelected()}
                  >
                  <MaterialCommunityIcons   
                    name='delete-circle'
                    style={{fontSize:24, paddingRight:10, color:'white'}}
                  /><Text style={{color: 'white', fontSize:16,}}>
                  Suprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{flexDirection:'row', flex:0.5, height:50, alignItems:'center', justifyContent:'center',}}
                  onPress = {() => this.selectItems(false)}
                  >
                  <MaterialCommunityIcons   
                    name='close-circle'
                    style={{fontSize:24, paddingRight:10, color:'white'}}
                  /><Text style={{color: 'white', fontSize:16,}}>
                  Annuler</Text>
                </TouchableOpacity>
              </View>
              }

              <ScrollView>
              { this.state.items.map((value, index) => 
                <TouchableOpacity  
                  key={index}
                  style={[styles.listItem,  this.state.items.length-1==index 
                    ? {borderBottomWidth:15}
                    : null
                  ]}
                  onPress = {() => this.selectItem(index)}
                  onLongPress = {() => this.selectItems(index)}
                  >
                  { this.state.selectItems === false ? null :
                    <View style={{
                      borderRadius:10,
                      margin:10, marginLeft:20,
                      height:20, width:20, borderWidth:2, borderColor:colors.greenDark, padding:2, 
                    }}>
                       <View style={{
                        borderRadius:6,
                        height:12, width:12,
                        backgroundColor: this.state.selectItems.indexOf(index)>=0
                          ? colors.greenFlash
                          : 'transparent'
                      }}></View>
                    </View>
                  }

                  { this.props.renderListItem(value, index) }

                </TouchableOpacity>
              )}
              </ScrollView>           
            </View>

          : this.props.renderDetailedItem(this.state.items[this.state.editing])
        }
      </View>
    );
  }

} 


const styles = StyleSheet.create({ 

  collection_grp:{
    padding:15,
    paddingTop:10,
  },
  collSectionTitle:{
    flexDirection:'row', flex:1, justifyContent:'center', marginTop:20, marginBottom:1,
  },
  collSectionTitleText:{
    // borderTopWidth:1,
    // borderTopColor:colors.greenFlash,
    fontSize:18, 
    fontWeight:'bold',
    flex:1, 
    textAlign:'center',
    padding:5, paddingTop:10,
    marginRight:15, marginLeft:15,
    // color:'white',
    color:colors.greenFlash,
    // backgroundColor:greenSuperLight,
    // backgroundColor:colors.greenFlash,
  },

  collection_subgrp:{
    borderWidth:1, borderColor:'lightgrey', padding:10, marginBottom:20,
    // backgroundColor:greenSuperLight,
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
  titleTextEdit:{
    backgroundColor:colors.greenFlash, 
    color:'white', 
    fontSize:18, 
    fontWeight:'bold', 
    textAlign:'center', 
    padding:10,
  },
  titleInputStyle:{
    backgroundColor:colors.greenFlash, 
    color:'white', 
    fontSize:18, 
    fontWeight:'bold', 
    textAlign:'center', 
    padding:10,
  },
  listItem:{
    padding:5,
    flexDirection:'row',
    borderBottomWidth:1,
    alignItems:'center',
    borderBottomColor:colors.greenFlash,
    // height:50,
  },
  listItemText:{
    color:'grey',
    fontSize:14,
    paddingRight:5,
  },
  listItemNew:{
    backgroundColor:colors.greenFlash,
  },

  collection_input_text:{
    padding:10, fontSize:16
  },


});
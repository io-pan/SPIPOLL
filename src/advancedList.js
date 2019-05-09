import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
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
      selectedItems:false,
      loading:true,
    };
    // this.editingRequested = false;
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
            loading:false,
            items:JSON.parse(items),
            editing: typeof this.props.editing != 'undefined' ? this.props.editing : false,// this.editingRequested,
          }, function(){
            // this.editingRequested = false;
            // console.log(this.props.localStorage, JSON.parse(items));
          });
        }

        // Create item if editing requested.
        else if( typeof this.props.editing != 'undefined'){
          this.newItem();
          // this.editingRequested = false;
        }
        else{
          this.setState({loading:false,});
        }
                  
      }
    });
  }

  newItem(){
    let data = {};

    // Get default data.
    if(this.props.newItem) {
      data = this.props.newItem(this.state.items.length);
    }

    // Create & store item.
    let items = this.state.items;
    items.push(data);

    if(this.props.selectItemAltFunction){
      this.setState({ 
        loading:false,
        items: items,
        // editing:items.length-1,
      }, function(){
        AsyncStorage.setItem(this.props.localStorage, JSON.stringify( this.state.items ));
        this.props.selectItemAltFunction(this.state.items.length-1);
      });
    }
    else{
      this.setState({ 
        items: items,
        editing:items.length-1,
      }, function(){
        AsyncStorage.setItem(this.props.localStorage, JSON.stringify( this.state.items ));
      });
    }

    // callback ?
  }

  storeItemField(key, val, index=false){
    let items = this.state.items;
    if(index===false){
      items[this.state.editing][key] = val;
    }
    else{
      items[index][key] = val;
    }
    
    this.setState({items:items}, function(){
      AsyncStorage.setItem(this.props.localStorage, JSON.stringify( this.state.items ));
    })
  }

  selectItem(index){
    if(this.state.items.length==0){
      // this.editingRequested = index; // storage not loaded
    }

    else{
      // Deal with action.
      if(this.state.selectedItems!==false){
        let selectedItems = this.state.selectedItems;
        const i = selectedItems.indexOf(index);
        if(i<0){
          selectedItems.push(index);
        }
        else{
          selectedItems.splice(i, 1);
        }
        this.setState({selectedItems:selectedItems}); 
      }
      else{
        if(this.props.selectItemAltFunction){
          this.props.selectItemAltFunction(index);
        }
        else{
          this.setState({editing:index});      
        }
      } 
    }
  }

  selectedItems(index) {
    if(index===false){
      this.setState({selectedItems:false});
    }
    else {
      this.setState({selectedItems:[index]});
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
             this.deleteItems(this.state.selectedItems);
          }
        },
      ],
    );
  }

  deleteItems(selected){
    const items = this.state.items;

    // Backward loop to avoid re-index issue.
    for (var i = items.length - 1; i >= 0; i--) {
      if(selected.indexOf(i) !== -1) {
        // Delete folders & co.
        if(this.props.deleteItem) {
          this.props.deleteItem(items[i], i);
        }
        // Remove from list.
        items.splice(i, 1);
      }
    }

    // Store purged list.
    this.setState({
      items:items,
      selectedItems:false,
    }, function(){
      AsyncStorage.setItem(this.props.localStorage, JSON.stringify( this.state.items ));
    });
  }


  //TODO: as props
  actions = [
  {
    label:'Annuler', 
    icon:'cancel',
    action: ()=> this.selectedItems(false)
  },
  {
    label:'Supprimer',
    icon:'trash-can-outline',
    action: () => this.deleteSelected()
  }];

  renderActions(){
    return(
      <View  
        style={{
          height:55,
          flexDirection:'row', alignItems:'center', justifyContent:'center',
          backgroundColor:colors.greenFlash,
          borderTopWidth:1, borderTopColor:'white',
        }}
        >

      { this.state.selectedItems === false

      ? // Default button: NEW ITEM
        this.props.newItemContent === false ? null :
        <TouchableOpacity  
          onPress = {() => this.newItem()}
          >
          { this.props.newItemContent }
        </TouchableOpacity>
        
      : // CANCEL / DELETE 
        this.actions.map((value, index) => 
          <TouchableOpacity
            key={index}
            style={{
              flexDirection:'row', flex:1/this.actions.length, height:50, alignItems:'center', justifyContent:'center',
              borderRightWidth:1, borderRightColor:'white'}}
            onPress = {value.action}
            >
            <MaterialCommunityIcons   
              name={value.icon}
              style={{fontSize:24, paddingRight:10, color:'white'}}
            /><Text style={{color: 'white', fontSize:16,}}>
            {value.label}</Text>
          </TouchableOpacity>
          )
      }
      </View>
    )
  }

  render(){
    return(
      <View style={{flex:1}}>
        { this.state.editing !== false && this.props.renderDetailedItem

          ? this.props.renderDetailedItem(this.state.items[this.state.editing], this.state.editing)

          : <View style={{flex:1}}>
              
              { !this.state.items.length 
              ? <View style={{flex:1}}>
                  <Text style={{textAlign:'center', padding:20}}>
                     { this.state.loading ? 'Chargement' : 'Aucun élément' }
                  </Text>
                  <FooterImage/>
                </View>

              : <ScrollView 
                  style={{}}
                  contentContainerStyle={{ 
                    flexGrow: 1,
                    justifyContent: 'space-between' 
                  }}
                  >

                  { this.state.items.map((value, index) => 
                    <TouchableOpacity 
                      key={index}
                      style={styles.listItem}
                      onPress = {() => this.selectItem(index)}
                      onLongPress = {() => this.selectedItems(index)}
                      >
                      { this.state.selectedItems === false ? null :
                        <View style={{
                          borderRadius:10,
                          margin:10, marginLeft:20,
                          height:20, width:20, borderWidth:2, borderColor:colors.greenDark, padding:2, 
                        }}>
                           <View style={{
                            borderRadius:6,
                            height:12, width:12,
                            backgroundColor: this.state.selectedItems.indexOf(index)>=0
                              ? colors.greenFlash
                              : 'transparent'
                          }}></View>
                        </View>
                      }

                      { this.props.renderListItem(value, index) }

                    </TouchableOpacity>
                  )}

                  <FooterImage/>
                </ScrollView>
              }

              { this.props.newItemContent || this.state.selectedItems.length
              ? this.renderActions() 
              : null
              }            
            </View>
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
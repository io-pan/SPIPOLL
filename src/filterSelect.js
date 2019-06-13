import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Modal,
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  // KeyboardAvoidingView,
  // Platform,
  ScrollView
} from 'react-native'


import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FooterImage from './footerimage';

export default class ModalFilterPicker extends Component {
  constructor (props, ctx) {
    super(props, ctx)

    this.state = {
      visible:false,
      filter: '',
      ds: props.options,
    }
    this.sizeAdjust={scr:0, cont:0}
  }

  componentWillReceiveProps (newProps) {
    if ((!this.props.visible && newProps.visible) || (this.props.options !== newProps.options)) {
      this.setState({
        filter: '',
        ds: this.props.options,
      }, function(){
        // this.refs['filter'].focus();
      });
    }
  }

  show(){
    // this.previouslength = 0;
    this.setState({
      visible:true,
      filter: '',
      ds: this.props.options,
    }, function(){
      setTimeout(this.refs.filter.focus, 1);
    });
  }
  hide(){
    this.setState({visible:false});
  }

  render () {
    const {
      title,
      titleTextStyle,
      overlayStyle,
      cancelContainerStyle,
      renderCancelButton,
      filterTextInputStyle,
      modal,
    } = this.props

    const renderedTitle = (!title) ? null : (
          <View 
            style={{
              height:55, flexDirection:'row', 
              justifyContent:'center', alignItems:'center',
              backgroundColor:this.props.highlightColor
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
               { title.replace("\n", " ") }</Text>
            </View>

          </View>
    )

    return (
      <Modal
        onRequestClose={() => this.hide()}
        {...modal}
        visible={this.state.visible}
        supportedOrientations={['portrait', 'landscape']}
        >
        {renderedTitle}
          
        {/*
        <KeyboardAvoidingView
          behavior="padding"
          // style={overlayStyle || styles.overlay}
          enabled={Platform.OS === 'ios'}
        >
        */}
      
          <TextInput
            ref="filter"
            onChangeText={this.onFilterChange}
            autoCorrect={false}
            blurOnSubmit={true}
            autoFocus={true}
            keyboardType="default"
            autoCapitalize="none"
            placeholder={' Filtrer ...'}
            style={filterTextInputStyle || styles.filterTextInput} 
          />
           
          {this.renderOptionList()}
        {/*</KeyboardAvoidingView>*/}
      </Modal>
    )
  }

  renderOptionList = () => {
    const {
      noResultsText,
      FlatListProps,
      keyboardShouldPersistTaps
    } = this.props

    const { ds } = this.state

    if (1 > ds.length) {
      return (
        <View style={{flex:1, backgroundColor:'#fafaff'}} >
          <Text style={{textAlign:'center', marginTop:10, marginBottom:10}}>
          {noResultsText}</Text>

          <View style={{marginTop:50, backgroundColor:'#fafaff', flex:1, justifyContent:'flex-end'}}>
            <FooterImage/>
          </View>
        </View>
      );
    } else {
// TODO highlight pas Ab(eille) quand on tape ab =>  filtré alors qu'il doit pas (autre ex: coqueli)
      return (
        <View style={{flex:1, backgroundColor:'#fafaff'}} >
          <Text style={{textAlign:'center', marginTop:10, marginBottom:10}}>
          {ds.length} résultat{ds.length>1 ?'s':''}</Text>
        
          <View style={{flex:1, backgroundColor:'#92c83e'}}>
          <ScrollView>
         
            <View  style={{ padding:10, paddingBottom:50, backgroundColor:'#fafaff'}}>
            <FlatList
              {...FlatListProps}
              keyExtractor ={(item, index) => ''+item.value}
              data={ds}
              extraData={ds}
              renderItem={this.renderOption}
              // keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            />
            </View>
      
            <View style={{backgroundColor:'#fafaff'}}>
              <FooterImage/>
            </View>
         
          </ScrollView>
           </View>
        </View>
      )
    }
  }

  renderOption = (rowData) => {
    const {
      selectedOption,
      renderOption,
      optionTextStyle,
      selectedOptionTextStyle
    } = this.props

    const { key, name, label, value } = rowData.item;

    // let style = styles.optionStyle
    // let textStyle = optionTextStyle||styles.optionTextStyle

    // if (key === selectedOption) {
      // style = styles.selectedOptionStyle
      // textStyle = selectedOptionTextStyle ||styles.selectedOptionTextStyle
    // }

    if (renderOption) {
      return renderOption(rowData, key === selectedOption)
    } else {

      return (
        <TouchableOpacity activeOpacity={0.7}
  		    key={value}
  	      style={{
            flex:1,
  	      	padding:5,
  	      	borderBottomWidth:1,
  	      	borderBottomColor:'#92c83e',
  	      }}
          onPress={() => {
            this.hide();
            this.props.onSelect(rowData.item)
          }}
          >
          { !this.state.filter
            ?
            <View>
              <Text style={{fontSize:14, color:'#333333'}}>{name}</Text>
              <Text style={{fontSize:12, color:'#888888'}}>{label}</Text>
            </View>
            :
            [this.renderLabel(name, this.props.resultLabelStyle, 0),
            this.renderLabel(label, this.props.resultEspeceStyle, 1)]
          }
        </TouchableOpacity>
      )
    }
  }

  renderLabel(label, style, key){
    if(!label) return;
    
    var startIndex = 0, 
        index,
        spited = [],
        source_lower = label.toLowerCase(),
        search = this.state.filter.toLowerCase();
    const searchLen = search.length;

    while ((index = source_lower.indexOf(search, startIndex)) > -1) {
      spited.push({
        nomatch:label.substring(startIndex, index),
        filter:label.substring(index, index+searchLen),
      });
      startIndex = index + searchLen;
    }

    spited.push({
       nomatch:label.substring(startIndex),
       filter:'',
    })

    return(
      <View 
        key={key}
        style={{flexDirection:'row'}}
        >
        <Text style={style}>
        { spited.map((substr, index) => 
          <Text key={index}>
            {substr.nomatch}
            <Text style={this.props.resultHilightStyle}>
            {substr.filter}</Text>
          </Text>
        )}
        </Text>
      </View>
    );
  }

  renderCancelButton = () => {
    const {
      cancelButtonStyle,
      cancelButtonTextStyle,
      cancelButtonText
    } = this.props

    return (
      <TouchableOpacity onPress={() => this.hide()}
        activeOpacity={0.7}
        // style={cancelButtonStyle || styles.cancelButton}
      >
        <Text
         // style={cancelButtonTextStyle || styles.cancelButtonText}
         >{cancelButtonText}</Text>
      </TouchableOpacity>
    )
  }

  onFilterChange = (text) => {
    // if(text.length<2 && this.previouslength<text.length){
    //   return;
    // }
    // this.previouslength = text.length;

    const { options } = this.props

    const filter = text.toLowerCase()

    // apply filter to incoming data
    // const filtered = (!filter.length)
    //   ? options
    //   : options.filter(({ searchKey, name, label, key }) => (
    //     (    0 <= name.toLowerCase().indexOf(filter) 
    //       || label&&0  <= label.toLowerCase().indexOf(filter)) ||
    //       (searchKey && 0 <= searchKey.toLowerCase().indexOf(filter))
    //   ))
// console.log(options)
    const filtered = (!filter.length)
      ? options
      : options.filter(({ searchKey, name, label, key }) => (
        (    0 <= name.toLowerCase().indexOf(filter) 
          || label&&0  <= label.toLowerCase().indexOf(filter)) ||
          (searchKey && 0 <= searchKey.toLowerCase().indexOf(filter))
      ))

    this.setState({
      filter: text.toLowerCase(),
      ds: filtered,
    })
  }
}

ModalFilterPicker.propTypes = {
  options: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  // onCancel: PropTypes.func.isRequired,
  placeholderText: PropTypes.string,
  placeholderTextColor: PropTypes.string,
  androidUnderlineColor: PropTypes.string,
  cancelButtonText: PropTypes.string,
  title: PropTypes.string,
  noResultsText: PropTypes.string,
  visible: PropTypes.bool,
  showFilter: PropTypes.bool,
  modal: PropTypes.object,
  selectedOption: PropTypes.string,
  renderOption: PropTypes.func,
  renderCancelButton: PropTypes.func,
  FlatListProps: PropTypes.object,
  filterTextInputContainerStyle: PropTypes.any,
  filterTextInputStyle: PropTypes.any,
  cancelContainerStyle: PropTypes.any,
  cancelButtonStyle: PropTypes.any,
  cancelButtonTextStyle: PropTypes.any,
  titleTextStyle: PropTypes.any,
  overlayStyle: PropTypes.any,
  listContainerStyle: PropTypes.any,
  optionTextStyle:PropTypes.any,
  selectedOptionTextStyle:PropTypes.any,
  keyboardShouldPersistTaps: PropTypes.string
}

ModalFilterPicker.defaultProps = {
  placeholderText: 'Filtrer...',
  placeholderTextColor: '#ccc',
  androidUnderlineColor: 'rgba(0,0,0,0)',
  cancelButtonText: 'Annuler',
  noResultsText: 'Aucun résultat',
  visible: true,
  showFilter: true,
  keyboardShouldPersistTaps: 'never',
  filterTextInputStyle:{fontSize:18, backgroundColor:'white', 
    margin:10, 
    marginBottom:1, 
    padding:3,
    borderBottomWidth:1, borderBottomColor:'#92c83e', 
    textAlign:'center'
  },
  resultLabelStyle:{
    fontSize:14, color:'#333333',
  },
  resultEspeceStyle:{
    fontSize:12, color:'#888888',
  },
  resultHilightStyle:{
    fontWeight:'bold', color:'#92c83e',
  },
}
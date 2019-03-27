import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Modal,
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native'




export default class ModalFilterPicker extends Component {
  constructor (props, ctx) {
    super(props, ctx)

    this.state = {
      filter: '',
      ds: props.options,
    }
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

// TODO: flex on voit pas la fin de la liste
  render () {
    const {
      title,
      titleTextStyle,
      overlayStyle,
      cancelContainerStyle,
      renderCancelButton,
      filterTextInputStyle,
      visible,
      modal,
      onCancel
    } = this.props

    const renderedTitle = (!title) ? null : (
      <Text style={titleTextStyle || styles.titleTextStyle}
      >{title}</Text>
    )

    return (
      <Modal
        onRequestClose={onCancel}
        {...modal}
        visible={visible}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={{flex:1, backgroundColor:'#fafaff'}} >
        <KeyboardAvoidingView
          behavior="padding"
          // style={overlayStyle || styles.overlay}
          enabled={Platform.OS === 'ios'}
        >
          {renderedTitle}
          <View style={{padding:10}}>

          <TextInput
            ref="filter"
            // style={filterTextInputStyle}
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

        </View>
        </KeyboardAvoidingView>
        </View>
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
      return <Text style={{textAlign:'center'}}>{noResultsText}</Text>
    } else {
      return (
        <View>
        <Text style={{textAlign:'center', marginBottom:10}}>{ds.length} résultat{ds.length>1 ?'s':''}</Text>
        <FlatList
          {...FlatListProps}
          keyExtractor ={(item, index) => ''+item.value}
          data={ds}
          extraData={ds}
          renderItem={this.renderOption}
          // keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        />
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

    const { key, label, espece, value } = rowData.item;

    // let style = styles.optionStyle
    // let textStyle = optionTextStyle||styles.optionTextStyle

    if (key === selectedOption) {
      // style = styles.selectedOptionStyle
      // textStyle = selectedOptionTextStyle ||styles.selectedOptionTextStyle
    }

    if (renderOption) {
      return renderOption(rowData, key === selectedOption)
    } else {



      return (
        <TouchableOpacity activeOpacity={0.7}
  		    key={key}
  	      style={{
  	      	padding:5,
  	      	borderBottomWidth:1,
  	      	borderBottomColor:'#92c83e',
  	      }}
          onPress={() => this.props.onSelect(rowData.item)}
          >
          { !this.state.filter
            ?
            <View>
              <Text style={{fontSize:14, color:'#333333'}}>{label}</Text>
              <Text style={{fontSize:12, color:'#888888'}}>{espece}</Text>
            </View>
            :
            [this.renderLabel(label, this.props.resultLabelStyle, 0),
            this.renderLabel(espece, this.props.resultEspeceStyle, 1)]
          }
        </TouchableOpacity>
      )
    }
  }

  renderLabel(label, style, key){
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
          style={{flexDirection:'row',
                    }}
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
      <TouchableOpacity onPress={this.props.onCancel}
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
    const { options } = this.props

    const filter = text.toLowerCase()

    // apply filter to incoming data
    const filtered = (!filter.length)
      ? options
      : options.filter(({ searchKey, label, espece, key }) => (
        (    0 <= label.toLowerCase().indexOf(filter) 
          || espece&&0  <= espece.toLowerCase().indexOf(filter)) ||
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
  onCancel: PropTypes.func.isRequired,
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
    margin:5, padding:3, 
    // borderWidth:1, borderColor:'#92c83e', 
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
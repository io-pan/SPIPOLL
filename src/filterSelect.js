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
        <KeyboardAvoidingView
          behavior="padding"
          // style={overlayStyle || styles.overlay}
          enabled={Platform.OS === 'ios'}
        >
          {renderedTitle}
          <View style={{padding:10}}>

          <TextInput
            ref="filter"
            style={filterTextInputStyle}
            onChangeText={this.onFilterChange}
            autoCorrect={false}
            blurOnSubmit={true}
            autoFocus={true}
            keyboardType="default"
            autoCapitalize="none"
            placeholder={' Filtrer ...'}
            // style={filterTextInputStyle || styles.filterTextInput} 
          />
          {this.renderOptionList()}

        </View>
        </KeyboardAvoidingView>
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
        <FlatList
          {...FlatListProps}
          keyExtractor ={(item, index) => item.value}
          data={ds}
          extraData={ds}
          renderItem={this.renderOption}
          // keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        />
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
          <Text style={{fontSize:14, color:'#333333'}}>{label}</Text>
          <Text style={{fontSize:12, color:'#888888'}}>{espece}</Text>
        </TouchableOpacity>
      )
    }
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
      : options.filter(({ searchKey, label, key }) => (
        0 <= label.toLowerCase().indexOf(filter) ||
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
  filterTextInputStyle:{fontSize:18},
}
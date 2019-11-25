import { Tooltip } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import ExportField from 'components/export-field';
import styles from './export-select-fields.less';
import { FIELDS } from 'constants/export-step';
import React, { PureComponent } from 'react';
import createStyler from 'utils/styler.js';
import classnames from 'classnames';
import PropTypes from 'prop-types';


const style = createStyler(styles, 'export-select-fields');

const fieldInfoSprinkle = 'The fields displayed are from a sample of documents in the collection. To ensure all fields are exported, add missing field names.';

class ExportSelectFields extends PureComponent {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    exportStep: PropTypes.string.isRequired,
    updateFields: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.newFieldRef = React.createRef();
  }

  addNewFieldButton = () => {
    this.newFieldRef.current.scrollIntoView();
    this.newFieldRef.current.focus();
  }

  handleFieldCheckboxChange = (evt) => {
    const fields = Object.assign({}, this.props.fields);
    fields[`${evt.target.name}`] ^= 1; // flip 1/0 to its opposite
    this.props.updateFields(fields);
  }

  handleHeaderCheckboxChange = () => {
    const fields = Object.assign({}, this.props.fields);

    if (this.isEveryFieldChecked()) {
      Object.keys(fields).map(f => (fields[f] = 0));
    } else {
      Object.keys(fields).map(f => (fields[f] = 1));
    }

    this.props.updateFields(fields);
  }

  handleAddFieldSubmit = (evt) => {
    if (evt.key === 'Enter') {
      const obj = {};
      obj[evt.target.value] = 1;
      const fields = Object.assign(obj, this.props.fields);

      this.props.updateFields(fields);
      this.newFieldRef.current.focus();
    }
  }

  isEveryFieldChecked() {
    const fields = this.props.fields;

    return Object.keys(fields).every(f => fields[f] === 1);
  }

  renderFieldRows() {
    return Object.keys(this.props.fields).map((field, index) => (
      <ExportField
        key={index}
        field={field}
        index={index}
        checked={this.props.fields[field]}
        onChange={this.handleFieldCheckboxChange}/>
    ));
  }

  renderEmptyField() {
    const fieldsLen = Object.keys(this.props.fields).length;

    return (
      <tr key={`new-field ${fieldsLen}`}>
        <td/>
        <td className={style('field-number')}>{fieldsLen + 1}</td>
        <td>
          <input type="text"
            ref={this.newFieldRef}
            placeholder="Add field"
            className={style('add-field-input')}
            onKeyDown={this.handleAddFieldSubmit}/>
          <div className={style('return-symbol')}>
            <i className="fa fa-level-down fa-rotate-90"/>
            <p>to add</p>
          </div>
        </td>
      </tr>
    );
    // });
  }

  render() {
    if (this.props.exportStep !== FIELDS) return null;

    const addFieldButtonClassname = classnames('btn', 'btn-default', 'btn-xs', style('new-field'));

    return (
      <div>
        <div className={style('caption')}>
          <p>Select Fields</p>
          <div data-place="top"
            data-for="field-tooltip"
            data-tip={fieldInfoSprinkle}>
            <i className="fa fa-info-circle" />
            <Tooltip id="field-tooltip" />
          </div>
          <TextButton
            text="+ Add Field"
            className={addFieldButtonClassname}
            clickHandler={this.addNewFieldButton}/>
        </div>
        <div className={style('field-wrapper')}>
          <table className={style('table')}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    name="Select All"
                    checked={this.isEveryFieldChecked()}
                    onChange={this.handleHeaderCheckboxChange}/>
                </th>
                <th>&nbsp;</th>
                <th colSpan="2" className={style('field-name')}>Field Name</th>
              </tr>
            </thead>
            <tbody>
              {this.renderFieldRows()}
              {this.renderEmptyField()}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ExportSelectFields;

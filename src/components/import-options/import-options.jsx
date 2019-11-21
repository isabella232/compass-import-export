import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  FormGroup,
  InputGroup,
  FormControl,
  ControlLabel
} from 'react-bootstrap';
import { IconTextButton } from 'hadron-react-buttons';

import FILE_TYPES from 'constants/file-types';
import SelectFileType from 'components/select-file-type';

import styles from './import-options.less';
import createStyler from 'utils/styler.js';
const style = createStyler(styles, 'import-options');

class ImportOptions extends PureComponent {
  static propTypes = {
    delimiter: PropTypes.string,
    setDelimiter: PropTypes.func.isRequired,
    fileType: PropTypes.string,
    selectImportFileType: PropTypes.func.isRequired,
    fileName: PropTypes.string,
    selectImportFileName: PropTypes.func.isRequired,
    stopOnErrors: PropTypes.bool,
    setStopOnErrors: PropTypes.func,
    ignoreBlanks: PropTypes.bool,
    setIgnoreBlanks: PropTypes.func,
    fileOpenDialog: PropTypes.func
  };

  /**
   * Handle choosing a file from the file dialog.
   */
  // eslint-disable-next-line react/sort-comp
  handleChooseFile = () => {
    const file = this.props.fileOpenDialog();
    if (file) {
      this.props.selectImportFileName(file[0]);
    }
  };

  handleOnSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  };

  // TODO: lucas: Move `Select File` to a new component that
  // can be shared with export.
  render() {
    const isCSV = this.props.fileType === FILE_TYPES.CSV;

    return (
      <form onSubmit={this.handleOnSubmit} className={style('form')}>
        <FormGroup controlId="import-file">
          <ControlLabel>Select File</ControlLabel>
          <InputGroup bsClass={style('browse-group')}>
            <FormControl type="text" value={this.props.fileName} readOnly />
            <IconTextButton
              text="Browse"
              clickHandler={this.handleChooseFile}
              className={style('browse-button')}
              iconClassName="fa fa-folder-open-o"
            />
          </InputGroup>
        </FormGroup>
        <SelectFileType
          fileType={this.props.fileType}
          onSelected={this.props.selectImportFileType}
          label="Select Input File Type"
        />
        <fieldset>
          <legend className={style('legend')}>Options</legend>
          {isCSV && (
            <div className={style('option')}>
              <label className={style('option-select-label')}>
                Select delimiter
              </label>
              <select
                onChange={(evt) => {
                  this.props.setDelimiter(evt.currentTarget.value);
                }}
                defaultValue={this.props.delimiter}
                className={style('option-select')}>
                <option value=",">comma</option>
                <option value="\t">tab</option>
                <option value=";">semicolon</option>
                <option value=" ">space</option>
              </select>
            </div>
          )}
          <div className={style('option')}>
            <input
              type="checkbox"
              checked={this.props.ignoreBlanks}
              onChange={() => {
                this.props.setIgnoreBlanks(!this.props.ignoreBlanks);
              }}
              className={style('option-checkbox')}
            />
            <label className={style('option-checkbox-label')}>
              Ignore empty strings
            </label>
          </div>
          <div className={style('option')}>
            <input
              type="checkbox"
              checked={this.props.stopOnErrors}
              onChange={() => {
                this.props.setStopOnErrors(!this.props.stopOnErrors);
              }}
              className={style('option-checkbox')}
            />
            <label className={style('option-checkbox-label')}>
              Stop on errors
            </label>
          </div>
        </fieldset>
      </form>
    );
  }
}

export default ImportOptions;

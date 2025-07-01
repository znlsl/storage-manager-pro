import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { toast } from '../../hooks/useToast';
import { UtilsService } from '../../services/utils.service';
import { BaseModal } from './BaseModal';
import { CustomAlert } from '../common/CustomAlert';

interface EncodingToolModalProps {
  onClose: () => void;
}

export const EncodingToolModal: React.FC<EncodingToolModalProps> = ({
  onClose,
}) => {
  const { t } = useLanguage();
  const { alertState, showAlert, hideAlert } = useCustomDialog();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [activeTab, setActiveTab] = useState<'base64' | 'utf8' | 'utf8hex' | 'unicode'>('base64');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleBase64Encode = () => {
    try {
      const encoded = UtilsService.encodeBase64(inputText);
      setOutputText(encoded);
    } catch (error) {
      showAlert(t('encoding_error'), { type: 'error' });
    }
  };

  const handleBase64Decode = () => {
    try {
      const decoded = UtilsService.decodeBase64(inputText);
      setOutputText(decoded);
    } catch (error) {
      showAlert(t('decoding_error'), { type: 'error' });
    }
  };

  const handleUTF8Encode = () => {
    try {
      const encoded = UtilsService.encodeUTF8(inputText);
      setOutputText(encoded);
    } catch (error) {
      showAlert(t('encoding_error'), { type: 'error' });
    }
  };

  const handleUTF8Decode = () => {
    try {
      const decoded = UtilsService.decodeUTF8(inputText);
      setOutputText(decoded);
    } catch (error) {
      showAlert(t('decoding_error'), { type: 'error' });
    }
  };

  const handleUTF8HexEncode = () => {
    try {
      const encoded = UtilsService.encodeUTF8Hex(inputText);
      setOutputText(encoded);
    } catch (error) {
      showAlert(t('encoding_error'), { type: 'error' });
    }
  };

  const handleUTF8HexDecode = () => {
    try {
      const decoded = UtilsService.decodeUTF8Hex(inputText);
      setOutputText(decoded);
    } catch (error) {
      showAlert(t('decoding_error'), { type: 'error' });
    }
  };

  const handleUnicodeEncode = () => {
    try {
      const encoded = UtilsService.encodeUnicode(inputText);
      setOutputText(encoded);
    } catch (error) {
      showAlert(t('encoding_error'), { type: 'error' });
    }
  };

  const handleUnicodeDecode = () => {
    try {
      const decoded = UtilsService.decodeUnicode(inputText);
      setOutputText(decoded);
    } catch (error) {
      showAlert(t('decoding_error'), { type: 'error' });
    }
  };

  const handleHtmlEntityEncode = () => {
    try {
      const encoded = UtilsService.encodeHtmlEntity(inputText);
      setOutputText(encoded);
    } catch (error) {
      showAlert(t('encoding_error'), { type: 'error' });
    }
  };

  const handleHtmlEntityDecode = () => {
    try {
      const decoded = UtilsService.decodeHtmlEntity(inputText);
      setOutputText(decoded);
    } catch (error) {
      showAlert(t('decoding_error'), { type: 'error' });
    }
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      toast.success(t('copied_to_clipboard'));
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error(t('copy_error'));
    }
  };

  const handleSwapTexts = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={handleClear}>
        {t('clear')}
      </button>
      <button className="btn btn-secondary" onClick={onClose}>
        {t('close')}
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={t('encoding_tool')}
      footer={footer}
      maxWidth="800px"
      className="encoding-tool-modal"
    >
      <div className="encoding-tool-content">
        {/* Tab Navigation */}
        <div className="encoding-tabs">
          <button
            className={`tab-btn ${activeTab === 'base64' ? 'active' : ''}`}
            onClick={() => setActiveTab('base64')}
          >
            Base64
          </button>
          <button
            className={`tab-btn ${activeTab === 'utf8' ? 'active' : ''}`}
            onClick={() => setActiveTab('utf8')}
          >
            UTF-8 URL
          </button>
          <button
            className={`tab-btn ${activeTab === 'utf8hex' ? 'active' : ''}`}
            onClick={() => setActiveTab('utf8hex')}
          >
            UTF-8 Hex
          </button>
          <button
            className={`tab-btn ${activeTab === 'unicode' ? 'active' : ''}`}
            onClick={() => setActiveTab('unicode')}
          >
            Unicode
          </button>
        </div>

        {/* Input Section */}
        <div className="encoding-section">
          <label htmlFor="inputText">{t('input_text')}</label>
          <textarea
            id="inputText"
            className="form-control encoding-textarea"
            rows={6}
            value={inputText}
            onChange={handleInputChange}
            placeholder={t('enter_text_to_encode_decode')}
          />
        </div>

        {/* Action Buttons */}
        <div className="encoding-actions">
          {activeTab === 'base64' ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBase64Encode}
                disabled={!inputText.trim()}
              >
                {t('encode_base64')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBase64Decode}
                disabled={!inputText.trim()}
              >
                {t('decode_base64')}
              </button>
            </>
          ) : activeTab === 'utf8' ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUTF8Encode}
                disabled={!inputText.trim()}
              >
                {t('encode_utf8')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUTF8Decode}
                disabled={!inputText.trim()}
              >
                {t('decode_utf8')}
              </button>
            </>
          ) : activeTab === 'utf8hex' ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUTF8HexEncode}
                disabled={!inputText.trim()}
              >
                {t('encode_utf8_hex')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUTF8HexDecode}
                disabled={!inputText.trim()}
              >
                {t('decode_utf8_hex')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUnicodeEncode}
                disabled={!inputText.trim()}
              >
                {t('encode_unicode')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUnicodeDecode}
                disabled={!inputText.trim()}
              >
                {t('decode_unicode')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleHtmlEntityEncode}
                disabled={!inputText.trim()}
              >
                {t('encode_html_entity')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleHtmlEntityDecode}
                disabled={!inputText.trim()}
              >
                {t('decode_html_entity')}
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSwapTexts}
            disabled={!outputText.trim()}
          >
            {t('swap_texts')}
          </button>
        </div>

        {/* Output Section */}
        <div className="encoding-section">
          <label htmlFor="outputText">{t('output_text')}</label>
          <div className="output-container">
            <textarea
              id="outputText"
              className="form-control encoding-textarea"
              rows={6}
              value={outputText}
              readOnly
              placeholder={t('encoded_decoded_result')}
            />
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopyOutput}
              disabled={!outputText.trim()}
              title={t('copy_to_clipboard')}
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {/* Custom Dialogs */}
      <CustomAlert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
      />
    </BaseModal>
  );
};

import {Form, Input, Button, Alert, Space, Typography, Col} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import {getTransactionUrl} from '@figment-near/lib';
import {useState, useEffect} from 'react';
import axios from 'axios';
import {
  getCurrentStepIdForCurrentChain,
  useGlobalState,
  getCurrentChainId,
} from 'context';
import {getNearState} from '@figment-near/lib';

const layout = {
  labelCol: {span: 4},
  wrapperCol: {span: 20},
};

const tailLayout = {
  wrapperCol: {offset: 4, span: 20},
};

const {Text} = Typography;

const Transfer = () => {
  const {state, dispatch} = useGlobalState();
  const {NETWORK, SECRET, ACCOUNT_ID} = getNearState(state);

  const [toAddress, _setToAddress] = useState('pizza.testnet');
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [hash, setHash] = useState(null);

  useEffect(() => {
    if (hash) {
      dispatch({
        type: 'SetStepIsCompleted',
        chainId: getCurrentChainId(state),
        stepId: getCurrentStepIdForCurrentChain(state),
        value: true,
      });
    }
  }, [hash, setHash]);

  const transfer = async (values: any) => {
    const isValidAmount = parseFloat(values.amount);
    if (isNaN(isValidAmount)) {
      setError('Amount needs to be a valid number');
      throw Error('Invalid Amount');
    }
    const txAmount = values.amount;
    const txSender = values.from;
    const txReceiver = values.to;
    const options = {
      txSender,
      txAmount,
      txReceiver,
      NETWORK,
      SECRET,
    };
    setFetching(true);
    try {
      const response = await axios.post(`/api/near/transfer`, options);
      setHash(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  return (
    <Col>
      <Form
        {...layout}
        name="transfer"
        layout="horizontal"
        onFinish={transfer}
        initialValues={{
          from: ACCOUNT_ID,
          amount: 1,
          to: toAddress,
        }}
      >
        <Form.Item label="Sender" name="from" required>
          <Text code>{ACCOUNT_ID}</Text>
        </Form.Item>

        <Form.Item
          label="Amount"
          name="amount"
          required
          tooltip="1 NEAR = 10**24 yoctoNEAR"
        >
          <Space direction="vertical">
            <Input suffix="NEAR" style={{width: '200px'}} />
          </Space>
        </Form.Item>

        <Form.Item label="Recipient" name="to" required>
          <Text code>{toAddress}</Text>
        </Form.Item>

        <Form.Item {...tailLayout}>
          <Button type="primary" htmlType="submit" disabled={fetching}>
            Submit Transfer
          </Button>
        </Form.Item>

        {fetching && (
          <Form.Item {...tailLayout}>
            <Space size="large">
              <LoadingOutlined style={{fontSize: 24, color: '#1890ff'}} spin />
              <Text type="secondary">
                Transfer initiated. Waiting for confirmations...
              </Text>
            </Space>
          </Form.Item>
        )}

        {hash && (
          <Form.Item {...tailLayout}>
            <Alert
              type="success"
              showIcon
              message={<Text strong>Transfer confirmed!</Text>}
              description={
                <a
                  href={getTransactionUrl(hash ?? '')}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on NEAR Explorer
                </a>
              }
            />
          </Form.Item>
        )}

        {error && (
          <Form.Item {...tailLayout}>
            <Alert
              type="error"
              showIcon
              closable
              message={error}
              onClose={() => setError('')}
            />
          </Form.Item>
        )}
      </Form>
    </Col>
  );
};

export default Transfer;

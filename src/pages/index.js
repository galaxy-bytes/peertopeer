


import { useEffect, useState, useRef } from 'react';
import { Web5 } from '@web5/api';

export default function Dinger() {
  const [myDid, setMyDid] = useState(null);
  const [didValue, setDidValue] = useState(''); // State for the DID input
  const [noteValue, setNoteValue] = useState(''); // State for the note input
  const [web5, setWeb5] = useState(null);
  const [receivedDings, setReceivedDings] = useState([]); // State for the received dings
  // console.log(myDid)
  const didRef = useRef(null);
  useEffect(() => {
    const initWeb5 = async () => {


      const dingerProtocolDefinition = {
        'protocol': 'https://blackgirlbytes.dev/protocol',
        'published': true,
        'types': {
          'ding': {
            'schema': 'ding',
            'dataFormats': ['application/json']
          },
        },
        'structure': {
          'ding': {
            '$actions': [
              { 'who': 'anyone', 'can': 'write' },
              { 'who': 'author', 'of': 'ding', 'can': 'read' },
              { 'who': 'recipient', 'of': 'ding', 'can': 'read' }
            ]
          },
        }
      };
      const { web5, did } = await Web5.connect();
      setMyDid(did);
      setWeb5(web5);

      // fetch existing dings
      const { records, status: recordStatus } = await web5.dwn.records.query({
        message: {
          filter: {
            protocol: 'https://blackgirlbytes.dev/protocol',
            protocolPath: 'ding',
            // schema: 'ding',
            // recipient: did
          }
        }
      });

      Promise.all(records.map(async (record) => await record.data.json()))
        .then((results) => console.log(results))
        .catch((error) => console.error(error));
      // return promise of json data
      // const json = await records.map(async (record) => await record.data.json());

      if (recordStatus.code == 200) {
        const received = records.filter((record) => record.data.recipient === did);
        setReceivedDings(received);
      }




      // Configure the protocol
      const { protocols, status: protocolStatus } = await web5.dwn.protocols.query({
        message: {
          filter: {
            protocol: 'https://blackgirlbytes.dev/protocol'
          }
        }
      });

      if (protocolStatus.code !== 200) {
        alert('Failed to query protocols. Check console');
        console.error('Failed to query protocols', protocolStatus);
        return;
      }

      if (protocols.length > 0) {
        console.log('Protocol already exists');
        return;
      }

      const { status: configureStatus } = await web5.dwn.protocols.configure({
        message: {
          definition: dingerProtocolDefinition
        }
      });

      console.log('Configure protocol status', configureStatus);
    };

    initWeb5();
  }, []);

  const handleCopyDid = async () => {
    if (myDid) {
      try {
        await navigator.clipboard.writeText(myDid);
        console.log(myDid)
        alert('DID copied to clipboard');
      } catch (err) {
        alert('Failed to copy DID: ' + err);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (didValue.length === 0) {
      alert('DID required');
      return;
    }

    const ding = { dinger: myDid }; // Assume myDid is available in this scope

    if (noteValue) {
      ding.note = noteValue;
    }

    try {
      const { record, status } = await web5.dwn.records.write({
        data: ding,
        message: {
          protocol: 'https://blackgirlbytes.dev/protocol', // Replace with your protocol URL
          protocolPath: 'ding',
          schema: 'ding',
          recipient: didValue // Use the state variable
        }
      });
      console.log('this should send to', didValue)
      if (status.code !== 202) {
        alert(`${status.code} - ${status.detail}`);
        return;
      }

      const { status: sendStatus } = await record.send(didValue); // Use the state variable

      if (sendStatus.code !== 202) {
        alert(`${sendStatus.code} - ${sendStatus.detail}`);
        return;
      }

      alert(`Dinged ${didValue}!`);
    } catch (e) {
      alert(e.message);
      return;
    }
  };

  return (
    <div>
      <button id="copy-did" onClick={handleCopyDid}>Copy your DID</button>
      <form id="ding-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter DID"
          value={didValue}
          onChange={(e) => setDidValue(e.target.value)} // Update state on input change
        />
        <input
          type="text"
          placeholder="Enter Note (Optional)"
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)} // Update state on input change
        />
        <button type="submit">Ding</button>
      </form>
      <ul id="dinged-list"></ul>
      <h2>Dinged by</h2>
      <ul id="dinged-by-list">
        {receivedDings.map((ding, index) => (
          console.log(ding),
          <li key={index}>
            <p>{ding.data.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}



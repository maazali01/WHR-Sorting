const net = require('net');

// Test spawn supervisor (10021)
const testSpawn = () => {
  const client = new net.Socket();
  client.connect(10021, 'localhost', () => {
    console.log('✅ Connected to spawn supervisor (10021)');
    client.write('TEST:Can,Bottle');
  });
  
  client.on('data', (data) => {
    console.log('📥 Spawn response:', data.toString());
    client.destroy();
    testMapping();
  });
  
  client.on('error', (err) => {
    console.error('❌ Spawn supervisor error:', err.message);
    testMapping();
  });
};

// Test mapping server (10022)
const testMapping = () => {
  const client = new net.Socket();
  client.connect(10022, 'localhost', () => {
    console.log('✅ Connected to mapping server (10022)');
    client.write('GET_MAPPING');
  });
  
  client.on('data', (data) => {
    console.log('📥 Mapping response:', data.toString());
    client.destroy();
    console.log('\n✅ Both servers are working!');
    process.exit(0);
  });
  
  client.on('error', (err) => {
    console.error('❌ Mapping server error:', err.message);
    process.exit(1);
  });
};

console.log('🧪 Testing TCP connections...\n');
testSpawn();

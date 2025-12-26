import socket
import time

def test_port(port, name):
    """Test if a port is accepting connections"""
    print(f"\n{'=' * 60}")
    print(f"Testing {name} (Port {port})")
    print('=' * 60)
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        
        print(f"⏳ Connecting to localhost:{port}...")
        sock.connect(('localhost', port))
        print(f"✅ Connection successful!")
        
        sock.close()
        return True
    except ConnectionRefusedError:
        print(f"❌ Connection refused - server not running")
        return False
    except socket.timeout:
        print(f"⏱️  Connection timeout")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_mapping_server():
    """Test mapping server with GET_MAPPING command"""
    print(f"\n{'=' * 60}")
    print(f"Testing Mapping Server Communication")
    print('=' * 60)
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        sock.connect(('localhost', 10022))
        print("✅ Connected to mapping server")
        
        print("📤 Sending: GET_MAPPING")
        sock.send(b"GET_MAPPING")
        
        data = sock.recv(1024).decode().strip()
        print(f"📥 Response: {data if data else '(empty - no active orders)'}")
        
        sock.close()
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def test_completion_notification(order_id="TEST12345"):
    """Test completion notification to backend"""
    print(f"\n{'=' * 60}")
    print(f"Testing Completion Notification")
    print('=' * 60)
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        
        print(f"⏳ Connecting to backend completion listener (port 10023)...")
        sock.connect(('localhost', 10023))
        print("✅ Connected!")
        
        message = f"COMPLETED:{order_id}"
        print(f"📤 Sending: {message}")
        sock.send(message.encode())
        
        print("⏳ Waiting for response...")
        response = sock.recv(1024).decode().strip()
        print(f"📥 Response: {response}")
        
        sock.close()
        
        if response in ['ACK', 'OK']:
            print("✅ Backend acknowledged completion!")
            return True
        elif response == 'NOT_FOUND':
            print("⚠️  Backend says order not found (expected for test)")
            return True
        else:
            print(f"⚠️  Unexpected response: {response}")
            return False
            
    except ConnectionRefusedError:
        print("❌ Backend not listening on port 10023")
        print("   Make sure your Node.js backend is running!")
        return False
    except socket.timeout:
        print("⏱️  Timeout - backend didn't respond")
        return False
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def test_full_workflow():
    """Test complete workflow: Add order → Process → Complete"""
    print(f"\n{'=' * 60}")
    print(f"Testing Full Workflow")
    print('=' * 60)
    
    test_order = "WORKFLOW1"
    
    try:
        # Step 1: Add order to mapping
        print("\n📝 Step 1: Adding test order to mapping...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        sock.connect(('localhost', 10022))
        sock.send(f"UPDATE:{test_order}:1:3:1".encode())  # Order, Crate 1, 3 products, Fast priority
        response = sock.recv(1024).decode()
        sock.close()
        
        if response != 'OK':
            print(f"❌ Failed to add order: {response}")
            return False
        print(f"✅ Order added: {test_order} → Crate 1 (3 products, Fast)")
        
        # Step 2: Simulate processing products
        print("\n📦 Step 2: Simulating product processing...")
        for i in range(1, 4):
            print(f"   Processing product {i}/3...")
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            sock.connect(('localhost', 10022))
            sock.send(f"PRODUCT_PROCESSED:{test_order}".encode())
            response = sock.recv(1024).decode()
            sock.close()
            
            print(f"   Response: {response}")
            
            if i < 3:
                time.sleep(0.5)
        
        print("\n✅ Workflow test completed!")
        print("   Check backend logs to see if order was marked as completed")
        return True
        
    except Exception as e:
        print(f"\n❌ Workflow test failed: {e}")
        return False

def main():
    print("\n" + "=" * 60)
    print("🧪 SOCKET CONNECTION DIAGNOSTIC TOOL")
    print("=" * 60)
    
    results = {
        'Mapping Server (10022)': test_port(10022, "Mapping Server"),
        'Backend Completion (10023)': test_port(10023, "Backend Completion Listener"),
    }
    
    print(f"\n{'=' * 60}")
    print("📊 CONNECTION TEST RESULTS")
    print('=' * 60)
    for name, status in results.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {name}: {'Online' if status else 'Offline'}")
    
    # If both are online, run communication tests
    if all(results.values()):
        print("\n✅ All servers online - running communication tests...")
        test_mapping_server()
        test_completion_notification()
        
        # Ask user if they want to test full workflow
        print(f"\n{'=' * 60}")
        print("⚠️  Full workflow test will create a test order")
        user_input = input("Run full workflow test? (y/n): ").strip().lower()
        if user_input == 'y':
            test_full_workflow()
    else:
        print("\n❌ Some servers are offline!")
        print("\n📋 Startup checklist:")
        if not results['Mapping Server (10022)']:
            print("   1. Start mapping server: python order_mapping.py")
        if not results['Backend Completion (10023)']:
            print("   2. Start Node.js backend: npm start (or node server.js)")
    
    print(f"\n{'=' * 60}")
    print("🏁 Diagnostic complete!")
    print('=' * 60 + "\n")

if __name__ == "__main__":
    main()
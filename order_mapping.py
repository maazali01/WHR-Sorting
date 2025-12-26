import socket
import threading
import time

# Configuration
MAPPING_PORT = 10022
BACKEND_PORT = 10023
BACKEND_HOST = '127.0.0.1'

# Data Store: { 'ORDER_ID': {'crate': 1, 'total': 3, 'processed': 0, 'priority': 0, 'products': ['Can', 'Bottle']} }
orders = {}
lock = threading.Lock()

def notify_backend_completion(order_id):
    """Connects to Backend to notify order completion with retries"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"📞 Notifying backend about completion of {order_id} (Attempt {attempt+1})...")
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((BACKEND_HOST, BACKEND_PORT))
            sock.send(f"COMPLETED:{order_id}".encode())
            
            response = sock.recv(1024).decode().strip()
            sock.close()
            
            if response == 'ACK':
                print(f"✅ Backend acknowledged completion of {order_id}")
                return True
            elif response == 'NOT_FOUND':
                print(f"⚠️ Backend could not find order {order_id} (might be already completed)")
                return True 
            else:
                print(f"❓ Unexpected backend response: {response}")
                
        except ConnectionRefusedError:
            print(f"❌ Connection refused by backend (Port {BACKEND_PORT}). Is the server running?")
            time.sleep(1)
        except socket.timeout:
            print(f"⏱️ Connection timeout (Attempt {attempt+1}/{max_retries})")
            time.sleep(1)
        except Exception as e:
            print(f"❌ Error notifying backend: {e}")
            time.sleep(1)
            
    print(f"❌ Failed to notify backend after {max_retries} attempts")
    return False

def handle_client(client_socket):
    try:
        data = client_socket.recv(2048).decode().strip()  # Increased buffer for product lists
        if not data: 
            return

        print(f"\n📨 Received: {data[:100]}{'...' if len(data) > 100 else ''}")

        # 1. GET_MAPPING - Controller requests active orders
        if data == "GET_MAPPING":
            with lock:
                active_orders = []
                for oid, info in orders.items():
                    if info['processed'] < info['total']:
                        priority = info.get('priority', 0)
                        active_orders.append(f"{oid}:{info['crate']}:{priority}")
                
                response = ",".join(active_orders)
                
                if response:
                    print(f"📤 Sending active orders:")
                    for order_str in active_orders:
                        parts = order_str.split(':')
                        priority_label = "FAST" if parts[2] == '1' else "NORMAL"
                        order_id = parts[0]
                        products = orders[order_id].get('products', [])
                        print(f"   • {order_id} → Crate {parts[1]} ({priority_label}) - Products: {', '.join(products)}")
                else:
                    print(f"📤 No active orders")
                
                client_socket.send(response.encode())

        # 2. ✅ GET_PRODUCTS - Get product list for specific order
        elif data.startswith("GET_PRODUCTS:"):
            _, order_id = data.split(':', 1)
            with lock:
                if order_id in orders:
                    products = orders[order_id].get('products', [])
                    response = ",".join(products)
                    print(f"📤 Products for {order_id}: {response}")
                    client_socket.send(response.encode())
                else:
                    print(f"⚠️ Order {order_id} not found")
                    client_socket.send(b"NOT_FOUND")

        # 3. UPDATE - Add new order (from backend)
        elif data.startswith("UPDATE:"):
            # Format: UPDATE:ORDERID:CRATE:TOTAL:PRIORITY:PRODUCT1,PRODUCT2,PRODUCT3
            parts = data.split(':', 5)  # Split into max 6 parts
            
            if len(parts) >= 6:
                # New format with priority AND products
                _, oid, crate, total, priority, products_str = parts
                priority_int = int(priority)
                products_list = [p.strip() for p in products_str.split(',')]
                
                with lock:
                    orders[oid] = {
                        'crate': int(crate),
                        'total': int(total),
                        'processed': 0,
                        'priority': priority_int,
                        'products': products_list  # ✅ Store product list
                    }
                
                priority_label = "FAST" if priority_int == 1 else "NORMAL"
                print(f"✅ Registered Order {oid}")
                print(f"   └─ Crate: {crate} | Total: {total} | Priority: {priority_label} ({priority_int})")
                print(f"   └─ Products: {', '.join(products_list)}")
                client_socket.send(b"OK")
                
            elif len(parts) == 5:
                # Backward compatibility: priority but no products
                _, oid, crate, total, priority = parts
                priority_int = int(priority)
                
                with lock:
                    orders[oid] = {
                        'crate': int(crate),
                        'total': int(total),
                        'processed': 0,
                        'priority': priority_int,
                        'products': []  # Empty product list
                    }
                
                priority_label = "FAST" if priority_int == 1 else "NORMAL"
                print(f"✅ Registered Order {oid} (no products)")
                print(f"   └─ Crate: {crate} | Total: {total} | Priority: {priority_label} ({priority_int})")
                client_socket.send(b"OK")
                
            elif len(parts) == 4:
                # Backward compatibility: no priority, no products
                _, oid, crate, total = parts
                
                with lock:
                    orders[oid] = {
                        'crate': int(crate),
                        'total': int(total),
                        'processed': 0,
                        'priority': 0,
                        'products': []
                    }
                
                print(f"✅ Registered Order {oid} (backward compat)")
                print(f"   └─ Crate: {crate} | Total: {total} | Priority: NORMAL (0)")
                client_socket.send(b"OK")
                
            else:
                print(f"❌ Invalid UPDATE format: {data}")
                print(f"   Expected: UPDATE:ORDERID:CRATE:TOTAL:PRIORITY:PRODUCT1,PRODUCT2")
                client_socket.send(b"ERROR_INVALID_FORMAT")

        # 4. PRODUCT_PROCESSED - Controller notifies product completion
        elif data.startswith("PRODUCT_PROCESSED:"):
            _, oid = data.split(':', 1)
            
            is_completed = False
            crate_num = 0
            priority = 0
            processed = 0
            total = 0
            
            with lock:
                if oid in orders:
                    orders[oid]['processed'] += 1
                    processed = orders[oid]['processed']
                    total = orders[oid]['total']
                    crate_num = orders[oid]['crate']
                    priority = orders[oid].get('priority', 0)
                    
                    priority_label = "FAST" if priority == 1 else "NORMAL"
                    
                    print(f"📦 Order {oid} ({priority_label}) Progress: {processed}/{total}")
                    
                    if processed >= total:
                        is_completed = True
                        print(f"🎉 Order {oid} is now COMPLETE!")
                else:
                    print(f"⚠️ Received update for unknown order: {oid}")
                    client_socket.send(b"UNKNOWN_ORDER")
                    return

            if is_completed:
                print(f"🔔 Notifying backend that order {oid} is complete...")
                
                if notify_backend_completion(oid):
                    client_socket.send(f"ORDER_COMPLETED:CRATE {crate_num}".encode())
                    
                    with lock:
                        if oid in orders:
                            del orders[oid]
                            print(f"✅ Order {oid} removed from active queue")
                            print(f"📊 Active orders remaining: {len(orders)}")
                else:
                    print(f"⚠️ Could not notify backend, but order is complete")
                    client_socket.send(b"COMPLETED_BUT_NOTIFICATION_FAILED")
            else:
                client_socket.send(f"PROGRESS:{processed}/{total}".encode())

        # 5. REMOVE - Manually remove order
        elif data.startswith("REMOVE:"):
            _, oid = data.split(':', 1)
            with lock:
                if oid in orders:
                    del orders[oid]
                    print(f"🗑️ Order {oid} manually removed")
                    print(f"📊 Active orders remaining: {len(orders)}")
                else:
                    print(f"⚠️ Cannot remove - Order {oid} not found")
            client_socket.send(b"REMOVED")
        
        # 6. STATUS - Debug command
        elif data == "STATUS":
            with lock:
                if not orders:
                    status_msg = "No active orders"
                    print(f"📊 {status_msg}")
                else:
                    print(f"📊 Active Orders ({len(orders)}):")
                    status_lines = [f"Active Orders: {len(orders)}"]
                    for oid, info in orders.items():
                        priority_label = "FAST" if info['priority'] == 1 else "NORMAL"
                        products = info.get('products', [])
                        status_line = f"{oid}: Crate {info['crate']}, {info['processed']}/{info['total']} ({priority_label}) - {', '.join(products)}"
                        print(f"   • {status_line}")
                        status_lines.append(status_line)
                    status_msg = "\n".join(status_lines)
                
                client_socket.send(status_msg.encode())
        
        else:
            print(f"❓ Unknown command: {data}")
            client_socket.send(b"UNKNOWN_COMMAND")
            
    except Exception as e:
        print(f"❌ Server Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client_socket.close()

def run_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', MAPPING_PORT))
    server.listen(10)
    
    print(f"\n{'='*60}")
    print(f"🗺️  ORDER MAPPING SERVER - PRODUCT MATCHING")
    print(f"{'='*60}")
    print(f"📡  Listening on port {MAPPING_PORT}")
    print(f"🔔  Backend notifications on port {BACKEND_PORT}")
    print(f"✅  Features:")
    print(f"    • Priority support (1=FAST, 0=NORMAL)")
    print(f"    • Product-to-Order matching")
    print(f"    • Progress tracking")
    print(f"{'='*60}\n")

    while True:
        try:
            client, addr = server.accept()
            print(f"🔌 New connection from {addr}")
            t = threading.Thread(target=handle_client, args=(client,))
            t.daemon = True
            t.start()
        except KeyboardInterrupt:
            print(f"\n\n🛑 Shutting down server...")
            break
        except Exception as e:
            print(f"❌ Error accepting connection: {e}")

    server.close()
    print(f"✅ Server stopped")

if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        print(f"\n\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
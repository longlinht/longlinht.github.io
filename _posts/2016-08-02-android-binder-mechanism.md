---
layout: post
cover: false
title: Android Binder Mechanism
date:   2016-08-02 19:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

#### What is Binder

* The Binder mechanism has started from a simple idea. 

> "Let requests and responses be written in an area where all processes can share and let each process refer to the memory address." 

* Binder is a IPC mechanism.

* Binder implementation is based on **OpenBinder**.

* Binder refers to a kernel memory which is shared between all processes to minimize the overhead caused by memory copy. 

* It provides the Remote Procedure Call (RPC) framework written in C++ for high productivity.

#### Why need Binder

* Android need IPC mechanism because of its loosely coupled component design. Every application in Android is comprised of some components ,like Activity or Service, they maybe in same process or not. If they are in different process, they need communicate each other.

* All of the default system functions of Android are provided as the **server process** type. In other words, to use the functions such as `SurfaceFlinger` or `AudioFlinger`, a request should be made as a separate process that runs on the user mode. As all system services are provided as a **server process**, a mechanism to send requests and responses to other processes is necessary. In Android it is called the Binder. Android uses functions provided by other processes through Binder.

* Android is based on Linux, Linux has a lot of IPC mechanism. But, Android didn't adopted it. Maybe because of performance and low memory of Android device.

#### The Benefits of Using Binder Mechanism

* Easy to expand or remove functions: It is easy to add a new system service or remove an existing function.

* Easy to port: Porting to a new processor requires few changes. A toolchain for porting is provided.

* Easy to test: Tests are limited by the component unit, so it is not necessary to test the entire services, and more strict tests are available.

* Support for distribution system: Process communication is based on the Binder, so it guarantees transparency in location between components.

#### Binder Driver

A Binder Driver is implemented to use the kernel space. The role of the Binder driver is to convert the memory address that each process has mapped with the memory address of the kernel space for reference.

#### Understanding Binder Mechanism through Media Service 

##### `ServiceManager`

ServiceManager is a system manager which manages all services in Android.

##### What is Media Service

* Media Service is a general C++ application, is core of android media.

* Media Service is a general service Android supplied.

* Source code location: *frameworks/base/media/mediaserver/main_mediaserver.cpp*

* Entry point:

```c++
int main(int argc, char** argv)
{
    // Require a ServiceManager proxy
    sp<ProcessState> proc(ProcessState::self());
    sp<IServiceManager> sm = defaultServiceManager();
    LOGI("ServiceManager: %p", sm.get());
    AudioFlinger::instantiate();
    MediaPlayerService::instantiate();
    CameraService::instantiate();
    AudioPolicyService::instantiate();
    
    // Forever process messages sent from Binder.
    ProcessState::self()->startThreadPool();
    IPCThreadState::self()->joinThreadPool();
}
```
* Media server service has four sub-module.

  * `AudioFlinger`

  * `MediaPlayerService`

  * `CameraService`

  * `AudioPolicyService`
    
##### `ProcessState`

* Source code location: *frameworks/base/libs/binder/ProcessState.cpp*

* Media Service first call `ProcessState::self()`

```c++
sp<ProcessState> ProcessState::self()
{
    if (gProcess != NULL) return gProcess;
    
    AutoMutex _l(gProcessMutex);
    if (gProcess == NULL) gProcess = new ProcessState;
    return gProcess;
}
```

* Then `ProcessState::self()` call ProcessState constructor

```c++
ProcessState::ProcessState()
    : mDriverFD(open_driver())
    , mVMStart(MAP_FAILED) // Map the memory start address
    , mManagesContexts(false)
    , mBinderContextCheckFunc(NULL)
    , mBinderContextUserData(NULL)
    , mThreadPoolStarted(false)
    , mThreadPoolSeq(1)
{
    if (mDriverFD >= 0) {
        // XXX Ideally, there should be a specific define for whether we
        // have mmap (or whether we could possibly have the kernel module
        // availabla).
#if !defined(HAVE_WIN32_IPC)
        // mmap the binder, providing a chunk of virtual address space to receive transactions.
        mVMStart = mmap(0, BINDER_VM_SIZE, PROT_READ, MAP_PRIVATE | MAP_NORESERVE, mDriverFD, 0);
        if (mVMStart == MAP_FAILED) {
            // *sigh*
            LOGE("Using /dev/binder failed: unable to mmap transaction memory.\n");
            close(mDriverFD);
            mDriverFD = -1;
        }
#else
        mDriverFD = -1;
#endif
    }
    if (mDriverFD < 0) {
        // Need to run without the driver, starting our own thread pool.
    }
}
```

* `open_driver()` function

    * Very important function call to open a virtual device for communication.

    * This functon will open this device **/dev/binder**.

* When `ProcessState::self()` complete, it had do two important jobs:

    * Open the virtual device **/dev/binder**, so there has been a channel to communicate with kernel.
    * Map **/dev/binder** device's fd to memory.  

##### `defaultServiceManager()`

* Source code location: *frameworks/base/libs/binder/IServiceManager.cpp*

* Trace the source code call path, finally find that this call `sp<IServiceManager> sm = defaultServiceManager()` equals `gDefaultServiceManager = interface_cast<IServiceManager>(new BpBinder(0))`.

* BpBinder

  * Source code location: *frameworks/base/libs/binder/BpBinder.cpp*

  * BpBinder constructor:

```c++
BpBinder::BpBinder(int32_t handle)
    : mHandle(handle)
    , mAlive(1)
    , mObitsSent(0)
    , mObituaries(NULL)
{
    LOGV("Creating BpBinder %p handle %d\n", this, mHandle);

    extendObjectLifetime(OBJECT_LIFETIME_WEAK);
    IPCThreadState::self()->incWeakHandle(handle);
}
```

* What did `interface_cast` do?

   * `interface_cast` defined in */home/tao/android_source/frameworks/base/include/binder/IInterface.h*
  
   * `interface_cast` defination

```c++
template<typename INTERFACE>
inline sp<INTERFACE> interface_cast(const sp<IBinder>& obj)
{
    return INTERFACE::asInterface(obj);
}
```
   * So `gDefaultServiceManager = interface_cast<IServiceManager>(new BpBinder(0))` statement call `interface_cast` will equals:

```c++
inline sp<IServiceManager> interface_cast(const sp<IBinder>& obj)
{
    return IServiceManager::asInterface(obj);
}
```

* We need find clue in `IServiceManager`

    * Source code location: *frameworks/base/include/binder/IInterface.h*
    
    * `IServiceManager` defination

```c++
class IServiceManager : public IInterface
{
public:
    DECLARE_META_INTERFACE(ServiceManager);

    /**
     * Retrieve an existing service, blocking for a few seconds
     * if it doesn't yet exist.
     */
    virtual sp<IBinder>         getService( const String16& name) const = 0;

    /**
     * Retrieve an existing service, non-blocking.
     */
    virtual sp<IBinder>         checkService( const String16& name) const = 0;

    /**
     * Register a service.
     */
    virtual status_t            addService( const String16& name,
                                            const sp<IBinder>& service) = 0;

    /**
     * Return list of all existing services.
     */
    virtual Vector<String16>    listServices() = 0;

    enum {
        GET_SERVICE_TRANSACTION = IBinder::FIRST_CALL_TRANSACTION,
        CHECK_SERVICE_TRANSACTION,
        ADD_SERVICE_TRANSACTION,
        LIST_SERVICES_TRANSACTION,
    };
};
```     
    * We need trace this macro `DECLARE_META_INTERFACE(ServiceManager)` 

```c++
#define DECLARE_META_INTERFACE(INTERFACE)                             
    static const String16 descriptor;                                 
    static sp<I##INTERFACE> asInterface(const sp<IBinder>& obj);      
    virtual const String16& getInterfaceDescriptor() const;           
    I##INTERFACE();                                                   
    virtual ~I##INTERFACE();                                          


#define IMPLEMENT_META_INTERFACE(INTERFACE, NAME)                     
    const String16 I##INTERFACE::descriptor(NAME);                    
    const String16& I##INTERFACE::getInterfaceDescriptor() const {    
        return I##INTERFACE::descriptor;                              
    }                                                                 
    sp<I##INTERFACE> I##INTERFACE::asInterface(const sp<IBinder>& obj)
    {                                                                 
        sp<I##INTERFACE> intr;                                        
        if (obj != NULL) {                                            
            intr = static_cast<I##INTERFACE*>(                        
                obj->queryLocalInterface(                             
                        I##INTERFACE::descriptor).get());             
            if (intr == NULL) {                                       
                intr = new Bp##INTERFACE(obj);                        
            }                                                         
        }                                                             
        return intr;                                                  
    }                                                                 
    I##INTERFACE::I##INTERFACE() { }                                  
    I##INTERFACE::~I##INTERFACE() { }                                 
```

* Finally, we find that `interface_cast<IServiceManager>(new BpBinder(0))` statement actually return a `BpServiceManager` object. It means `sp<IServiceManager> sm = defaultServiceManager()` acquired a `BpServiceManager` object.

##### `BpServiceManager`

* Bp stands for Binder proxy, it means `BpServiceManager` is `ServiceManager`'s proxy to Binder.

##### `MediaPlayerService`

* Source code location: *frameworks/base/media/libmediaplayerservice/MediaPlayerService.cpp*

* Defination and instantiation 

```c++
void MediaPlayerService::instantiate() {
    defaultServiceManager()->addService(
            String16("media.player"), new MediaPlayerService());
}

MediaPlayerService::MediaPlayerService()
{
    LOGV("MediaPlayerService created");
    mNextConnId = 1;
}

MediaPlayerService::~MediaPlayerService()
{
    LOGV("MediaPlayerService destroyed");
}
```

* `MediaPlayerService` derivatived from `BnMediaPlayerService`

* Bn stands for Binder native.

* Add `MediaPlayerService` to `ServiceManager`

```c++
virtual status_t addService(const String16& name, const sp<IBinder>& service)
{
    Parcel data, reply;
    data.writeInterfaceToken(IServiceManager::getInterfaceDescriptor());
    data.writeString16(name);
    data.writeStrongBinder(service);
    // remote() return BpBinder object
    status_t err = remote()->transact(ADD_SERVICE_TRANSACTION, data, &reply);
    return err == NO_ERROR ? reply.readInt32() : err;
}
```
* `remote()` return BpBinder

```c++
status_t BpBinder::transact(uint32_t code, const Parcel& data, Parcel* reply, uint32_t flags)
{
    // Once a binder has died, it will never come back to life.
    if (mAlive) {
        status_t status = IPCThreadState::self()->transact(
            mHandle, code, data, reply, flags);
        if (status == DEAD_OBJECT) mAlive = 0;
        return status;
    }

    return DEAD_OBJECT;
}
```

*  `IPCThreadState` do with transaction, write add service command and wait for response.

* `BpServiceManager` had sent a add service message, but who receive and process it?

* `BnServiceManager`? unfortunately it doesn't exist. service do same job.

* service
    * service is a general c++ applcation.

    * Source code location: *frameworks/base/cmds/servicemanager/service_manager.c*

    * Entry point:

```c++
int main(int argc, char **argv)
{
    struct binder_state *bs;
    //  BINDER_SERVICE_MANAGER is NULL, is a magic number
    void *svcmgr = BINDER_SERVICE_MANAGER;

    bs = binder_open(128*1024);

    if (binder_become_context_manager(bs)) {
        LOGE("cannot become context manager (%s)\n", strerror(errno));
        return -1;
    }

    svcmgr_handle = svcmgr;
    binder_loop(bs, svcmgr_handler);
    return 0;
}
```

#### Conclusion

Through tracing so many codes, the MediaPlayerService example maybe reveal the Binder's mysterious veil. We need write down some important conclusions:

* If two processes need communicate each other, one as Client, the other is Server, Server need registered to `ServiceManager`, if Client want request to Server, it need query Server's info from `ServiceManager`, based the qureid info, Client and Server can communicate each other. 

* Client, Server, `ServiceManager` are implemented in use space, Binder is implemented in kernel space.

* `ServiceManager` and Binder is implemented by Android, developers need implemente their Client and Server.

* Binder supplied device file **/dev/binder** communicate to user space. Client, Server and `ServiceManager` communicated to Binder through `open` and `ioctl` file operation function.

* Client and Server communicate each other immediately through Binder.

* `ServiceManager` is a daemon process, it manages Server, supply interface to qurey Server function.

If want to learn Android IPC mechanism deeply, a lot of Android source code need be read. Linus said:

> Read The Fucking Source Code.

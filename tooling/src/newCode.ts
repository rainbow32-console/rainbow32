export function _getCode(name: string): string {
    return `const mainscene=new scene<{}>({
    name:'main',
    objects:[],
    beforeinit:()=>({}),
    afterupdate(_cfg,_scene,_dt){
        print(" world")
    }
});

// if something may be running after remove() is called (because it is not called for update, or does not exit before the update call ends), please check that this is still true
let isrunning = false;

registergame({
    name: ${JSON.stringify(name.toLowerCase())},
    scenes: [mainscene],
    init(){
        isrunning=true;
    },
    remove(){
        isrunning=false;
    },
    update(_dt){
        cursor(screen.width/2,screen.height/2);
        print("hello,",);
    }
});`;
}

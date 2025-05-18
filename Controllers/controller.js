const GROQ = require('groq-sdk');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const groq = new GROQ({
    apiKey:process.env.API_KEY
})
function runSequentially(cmds,index,projectFolder,res,currentDir=projectFolder) {
    if(index>=cmds.length) {
        return res.status(200).json({status:'success',message:'all commands executed successfully',dataAdded:cmds});
    }
   let cmd = cmds[index].trim();
   const cdMatch = cmd.match(/^cd\s+(.+)/);
    if(cdMatch) {
         const dir = cdMatch[1].trim();
         const newDir = path.join(currentDir,dir);
         if(!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir,{recursive:true});
         } 
         return runSequentially(cmds,index+1,projectFolder,res,newDir);
        
    } 
    if(!cmd) {
        return runSequentially(cmds,index+1,projectFolder,res,currentDir);
    }
    console.log('current directory',currentDir);
    console.log('command to be executed',cmd);
    exec(cmd,{cwd:currentDir} ,(error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({status:'fail',message:`Error executing command: ${error.message}`});
        }
        if (stderr) {
            console.error(`Error output: ${stderr}`);
            return res.status(500).json({status:'fail',message:`Error output: ${stderr}`});
        }
        console.log(`Command output: ${stdout}`);
        runSequentially(cmds,index+1,projectFolder,res,currentDir);
        
    });
}












exports.Commands = async(req,res,next) =>{
    console.log('going in try blocl')
    try{
        console.log('entered in try block');
        const {message} = req.body;
        const {targetPath} = req.body;
        const {name} = req.body;
        if(!message) {
            return res.json({status:'not executed',message:'please provide the command to execute'});
        }
        if(!targetPath) {
            return res.json({message:'please specify the location of operation'});
        }
        console.log('program started');
        const projectFolder = path.resolve(targetPath,name);
        console.log('1');
        if(!fs.existsSync(projectFolder)) {
            fs.mkdirSync(projectFolder,{recursive:true});
        }
        console.log(2);;
        let ops;
        if(os.platform() == 'win32') ops = 'windows'
        else if(os.platform() == 'darwin') ops = 'macOs'
        else ops = 'linux';
        console.log(3);
        const prompt = `you have to produce the shell command statement for operating system ${ops},for the command ${message}, the shell commands will be given in the form of array like [command1,command2...] no other information will be given`;
        // const contentPrompt = `you have to check if the prompt provided tells u to also write the content in the specified targetPath given, if yes then write the shell commands for that too! for operating system ${ops},commands will be in the form of array like [command1,command2...] no other information will be given`;
        const chatCommand = await groq.chat.completions.create({
            messages:[{role:'user',content:prompt}],
            model:'llama-3.3-70b-versatile'
        })
        // const contentCommand = await groq.chat.completions.create({
        //     messages:[{role:'user',content:contentPrompt}],
        //     model:'llama-3.3-70b-versatile'
        // })
    //     console.log(contentCommand.choices[0]?.message?.content);
    //    console.log(contentCommand.choices[0]?.message?.content);  
    //    const contentstobeadded = JSON.parse(contentCommand.choices[0]?.message?.content || "[]");
    //    console.log('content to be added',contentstobeadded);  
        console.log(4);
        const executables = chatCommand.choices[0]?.message?.content || "no query is required";
        // let raw = command.
        console.log(executables)
        let arr = JSON.parse(executables);
        const nonInteractivePrompt = `Given this array of shell commands: ${JSON.stringify(arr)}, for the operating system ${ops}
        return a new array where each command is transformed to be non-interactive.
        Use the correct flags for each tool (such as -y, --yes, --non-interactive, -f, -p, or required arguments).
        For mkdir, use "-p" only on Linux/macOS. On Windows, do not use "-p".
        Do not change the order or meaning of commands, only add flags or arguments to make them non-interactive.
        Return ONLY the array, in valid JSON, and do not add or remove commands.
        The output format and order must always be strictly consistent for the same input. You have to strictly produce a fully non-interactive command`;
        const nonInteractiveCommand = await groq.chat.completions.create({
            messages:[{role:'user',content:nonInteractivePrompt}],
            model:'llama-3.3-70b-versatile'
        })
        let nonInteractivearr = JSON.parse(nonInteractiveCommand.choices[0]?.message?.content || "[]")
        console.log('it is here');
       // runSequentially(nonInteractivearr,0,projectFolder,res,projectFolder);
        console.log('it should be here too');
        console.log('non interactive commands',nonInteractivearr);
         res.status(200).json({status:'success',nonInteractivearr});
     
    } catch(error) {
        res.status(500).json({status:'fail',error:error.message});
    }
 }
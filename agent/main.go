package main

import (
  "encoding/json"
  "fmt"
  "log"
  "net"
  "net/http"
  "os"
  "os/exec"
  "path/filepath"
  "regexp"
  "strconv"
  "strings"
)

type CreateRequest struct { ServerID string `json:"serverId"`; Name string `json:"name"`; Memory int `json:"memory"`; Disk int `json:"disk"`; CPU int `json:"cpu"`; Version string `json:"version"` }
var idRE = regexp.MustCompile(`^[A-Za-z0-9_-]{1,80}$`)

func writeJSON(w http.ResponseWriter, code int, v any) { w.Header().Set("Content-Type","application/json"); w.WriteHeader(code); _=json.NewEncoder(w).Encode(v) }
func auth(next http.Handler) http.Handler { return http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){ expected:=os.Getenv("AGENT_TOKEN"); if expected=="" { writeJSON(w,500,map[string]any{"success":false,"message":"AGENT_TOKEN is not configured"}); return }; got:=strings.TrimSpace(strings.TrimPrefix(r.Header.Get("Authorization"),"Bearer ")); if got==""||got!=expected { writeJSON(w,401,map[string]any{"success":false,"message":"Unauthorized"}); return }; next.ServeHTTP(w,r) }) }
func health(w http.ResponseWriter,_ *http.Request){ writeJSON(w,200,map[string]any{"success":true,"agent":"BilloreCloud Node Agent","status":"online","version":"1.1.0"}) }
func run(args ...string) ([]byte,error) { return exec.Command("docker",args...).CombinedOutput() }
func containerName(id string) string { return "billorecloud-"+id }
func serverDir(id string) string { return filepath.Join("/opt/billorecloud/servers",id) }
func findPort() (int,error) { for p:=25565;p<=25664;p++ { l,e:=net.Listen("tcp",fmt.Sprintf("127.0.0.1:%d",p)); if e==nil { _=l.Close(); return p,nil } }; return 0,fmt.Errorf("no free Minecraft port in 25565-25664") }

func createServer(w http.ResponseWriter,r *http.Request){ var req CreateRequest; if json.NewDecoder(r.Body).Decode(&req)!=nil { writeJSON(w,400,map[string]any{"success":false,"message":"Invalid JSON"});return }; if !idRE.MatchString(req.ServerID)||req.Memory<512||req.Memory>65536||req.CPU<1||req.CPU>800||req.Disk<1||req.Disk>1000 { writeJSON(w,400,map[string]any{"success":false,"message":"Invalid server parameters"});return }; if req.Version=="" {req.Version="LATEST"}; if !regexp.MustCompile(`^[A-Za-z0-9._-]{1,30}$`).MatchString(req.Version) {writeJSON(w,400,map[string]any{"success":false,"message":"Invalid Minecraft version"});return}; if out,e:=run("inspect",containerName(req.ServerID)); e==nil && len(out)>0 {writeJSON(w,409,map[string]any{"success":false,"message":"Server container already exists"});return}; port,e:=findPort();if e!=nil{writeJSON(w,503,map[string]any{"success":false,"message":e.Error()});return}; if e=os.MkdirAll(serverDir(req.ServerID),0755);e!=nil{writeJSON(w,500,map[string]any{"success":false,"message":"Could not create server directory"});return}; cpus:=fmt.Sprintf("%.2f",float64(req.CPU)/100.0); args:=[]string{"run","-d","--name",containerName(req.ServerID),"--restart","unless-stopped","--memory",strconv.Itoa(req.Memory)+"m","--cpus",cpus,"-e","EULA=TRUE","-e","TYPE=PAPER","-e","VERSION="+req.Version,"-e","MEMORY="+strconv.Itoa(req.Memory)+"M","-p",fmt.Sprintf("%d:25565",port),"-v",serverDir(req.ServerID)+":/data","itzg/minecraft-server:latest"}; out,e:=run(args...);if e!=nil{log.Printf("docker create: %s",out);writeJSON(w,500,map[string]any{"success":false,"message":"Docker failed to create Minecraft server","details":string(out)});return}; id:=strings.TrimSpace(string(out));writeJSON(w,201,map[string]any{"success":true,"containerId":id,"port":port,"status":"OFFLINE"}) }
func action(w http.ResponseWriter,r *http.Request){ id:=r.PathValue("id"); action:=r.PathValue("action");if !idRE.MatchString(id){writeJSON(w,400,map[string]any{"success":false,"message":"Invalid server id"});return}; name:=containerName(id);var args []string;switch action{case "start":args=[]string{"start",name};case "stop":args=[]string{"stop",name};case "restart":args=[]string{"restart",name};case "status":out,e:=run("inspect","-f","{{.State.Status}}",name);if e!=nil{writeJSON(w,404,map[string]any{"success":false,"message":"Container not found"});return};s:=strings.TrimSpace(string(out));status:="OFFLINE";if s=="running"{status="ONLINE"};writeJSON(w,200,map[string]any{"success":true,"status":status});return;default:writeJSON(w,400,map[string]any{"success":false,"message":"Invalid action"});return};if out,e:=run(args...);e!=nil{writeJSON(w,500,map[string]any{"success":false,"message":"Docker action failed","details":string(out)});return};status:="OFFLINE";if action=="start"||action=="restart"{status="ONLINE"};writeJSON(w,200,map[string]any{"success":true,"status":status})}

func main(){ mux:=http.NewServeMux();mux.HandleFunc("/health",health);mux.Handle("/servers",auth(http.HandlerFunc(createServer)));mux.Handle("/servers/{id}/{action}",auth(http.HandlerFunc(action)));port:=os.Getenv("AGENT_PORT");if port==""{port="8080"};log.Printf("BilloreCloud Agent running on http://0.0.0.0:%s",port);log.Fatal(http.ListenAndServe(":"+port,mux)) }

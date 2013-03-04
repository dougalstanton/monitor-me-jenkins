/**
 * @author patcla
 */
const DEBUG = true;
const STATUSES = {
    'aborted': 0,
    'aborted_anime': 0,
    'disabled': 0,
    'disabled_anime': 0,
    'grey': 0,
    'grey_anime': 0,
    'blue': 1,
    'blue_anime': 1,
    'yellow': 2,
    'yellow_anime': 2,
    'red': 3,
    'red_anime': 3
}
const DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"JenkinsURL":""
	,"JenkinsView":""
	,"RefreshTime":15
	,"UseAuth":false
	,"username":""
	,"password":""
	,"ColumnCount":3
	,"DisplayHeroHTML":'<h1>Jenkins build monitor</h1><p>For more in formation on Jenkins <a rel="nofollow" class="external-link" target="_blank" href="http://jenkins-ci.org/">http://jenkins-ci.org/</a></p><ul><li><a target="_blank" title="Meet Jenkins" href="https://wiki.jenkins-ci.org/display/JENKINS/Meet+Jenkins">Meet Jenkins</a></li><li><a target="_blank" title="Use Jenkins" href="https://wiki.jenkins-ci.org/display/JENKINS/Use+Jenkins">Use Jenkins</a></li><li><a target="_blank" title="Extend Jenkins" href="https://wiki.jenkins-ci.org/display/JENKINS/Extend+Jenkins">Extend Jenkins</a></li></ul>'
}

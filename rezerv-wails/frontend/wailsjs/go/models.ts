export namespace main {
	
	export class BackupFile {
	    name: string;
	    size: number;
	    // Go type: time
	    date: any;
	
	    static createFrom(source: any = {}) {
	        return new BackupFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.size = source["size"];
	        this.date = this.convertValues(source["date"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CloudQuota {
	    total: number;
	    used: number;
	    trashed: number;
	    other: number;
	    free: number;
	
	    static createFrom(source: any = {}) {
	        return new CloudQuota(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.used = source["used"];
	        this.trashed = source["trashed"];
	        this.other = source["other"];
	        this.free = source["free"];
	    }
	}
	export class SettingsConfig {
	    bwlimit: string;
	    transfers: number;
	    projectPath: string;
	
	    static createFrom(source: any = {}) {
	        return new SettingsConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bwlimit = source["bwlimit"];
	        this.transfers = source["transfers"];
	        this.projectPath = source["projectPath"];
	    }
	}
	export class RetentionConfig {
	    enabled: boolean;
	    maxBackupCount: number;
	
	    static createFrom(source: any = {}) {
	        return new RetentionConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.maxBackupCount = source["maxBackupCount"];
	    }
	}
	export class Exclusions {
	    dirs: string[];
	    files: string[];
	    retention: RetentionConfig;
	    settings: SettingsConfig;
	
	    static createFrom(source: any = {}) {
	        return new Exclusions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dirs = source["dirs"];
	        this.files = source["files"];
	        this.retention = this.convertValues(source["retention"], RetentionConfig);
	        this.settings = this.convertValues(source["settings"], SettingsConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProjectConfig {
	    projectRoot: string;
	    projectName: string;
	    parentFolder: string;
	    rcloneExe: string;
	    exclusionsFile: string;
	
	    static createFrom(source: any = {}) {
	        return new ProjectConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectRoot = source["projectRoot"];
	        this.projectName = source["projectName"];
	        this.parentFolder = source["parentFolder"];
	        this.rcloneExe = source["rcloneExe"];
	        this.exclusionsFile = source["exclusionsFile"];
	    }
	}
	

}


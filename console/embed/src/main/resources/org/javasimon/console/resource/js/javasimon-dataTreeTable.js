"use strict";
var javasimon=window.javasimon||{};
window.javasimon=javasimon;
/**
 * DOM Helper to create and append nodes to DOM tree
 */
javasimon.DOMUtil={
	fnAppendChildElement:function(eParent,sName) {
		var eChild=document.createElement(sName);
		eParent.appendChild(eChild);
		return eChild;
	},
	fnAppendChildText:function(eParent,sText) {
		var eChild=document.createTextNode(sText);
		eParent.appendChild(eChild);
		return eChild;
	},
	fnSetClasses:function(eParent,asClasses) {
		var sClasses=asClasses.join(' ');
		eParent.setAttribute('class',sClasses);
	},
	fnGetClasses:function(eParent) {
		var sClasses=eParent.getAttribute('class');
		var asClasses;
		if (sClasses) {
			asClasses=sClasses.split(/\s+/);
		} else {
			asClasses=[];
		}
		return asClasses;
	},
	fnAppendClass:function(eParent,sClass) {
		var asClasses=this.fnGetClasses(eParent);
		asClasses.push(sClass);
		this.fnSetClasses(eParent, asClasses);
	},
	fnReplaceClass:function(eParent,sOldClass,sNewClass) {
		var asClasses=this.fnGetClasses(eParent);
		var bFound=false;
		for(var i=0;i<asClasses.length;i++) {
			if (asClasses[i]===sOldClass) {
				asClasses[i]=sNewClass;
				bFound=true;
			}
		}
		if (!bFound) {
			asClasses.push(sNewClass);
		}
		this.fnSetClasses(eParent, asClasses);
	}
};
javasimon.ObjectUtil={
	fnMerge:function (oTarget, oSource, bRecurse) {
		var tSourceProp,tTargetProp;
		for (var sProp in oSource) {
			if (bRecurse && typeof oTarget[sProp]==='object' && typeof oSource[sProp]==='object') {
				tSourceProp=oSource[sProp].constructor;
				tTargetProp=oTarget[sProp].constructor;
				if (tSourceProp===tTargetProp) {
					if (tTargetProp===Object) {						
						oTarget[sProp]=this.fnMerge(oTarget[sProp], oSource[sProp], true);
					} else if (tTargetProp===Array) {
						oTarget[sProp]=oTarget[sProp].concat(oSource[sProp]);
					}
				}
			} else {
				oTarget[sProp]=oSource[sProp];				
			}
		}
		return oTarget;
	}	
};
/**
 * Data Tree Table component main class
 */
javasimon.DataTreeTable=function(eTable, oSettings) {
	this.eTable=eTable;
	this.oSettings={
		oImages: {
			'spacer':		'resource/images/TreeTableSpacer.gif',
			'lastSpacer':		'resource/images/TreeTableLastSpacer.gif',
			'nodeExpanded':		'resource/images/TreeTableNodeExpanded.gif',
			'lastNodeExpanded':	'resource/images/TreeTableLastNodeExpanded.gif',
			'nodeCollapsed':	'resource/images/TreeTableNodeCollapsed.gif',
			'lastNodeCollapsed':	'resource/images/TreeTableLastNodeCollapsed.gif',
			'leaf':			'resource/images/TreeTableLeaf.gif',
			'lastLeaf':		'resource/images/TreeTableLastLeaf.gif'
		},
		aoColumns: [
			{sField:'name', sClass:'string', sTitle:'Name'}
		]
	};
	if (oSettings) {
		this.oSettings=javasimon.ObjectUtil.fnMerge(this.oSettings, oSettings, true);	
	}
};
javasimon.DataTreeTable.prototype={
	fnSetData:function(oParentNode,oParentData) {
		var aoChildDatas=oParentData.children;
		oParentNode.bHasChildren=false;
		if (aoChildDatas!== undefined) {			
			var nLastChildIndex=aoChildDatas.length-1;
			if (nLastChildIndex>=0) {
				oParentNode.aoChildren=[];
				oParentNode.bHasChildren=true;
				oParentNode.bExpanded=true;
			}
			for(var nChildIndex=0;nChildIndex<=nLastChildIndex;nChildIndex++) {
				var oChildData=aoChildDatas[nChildIndex];
				var nChildDepth=oParentNode.nDepth+1;
				var oChildNode={
					oParent:oParentNode,
					sHtmlId:oParentNode.sHtmlId+'_'+nChildIndex,
					nIndex:nChildIndex,
					bIsLast: nChildIndex===nLastChildIndex,
					nDepth:nChildDepth,
					oData:oChildData					
				};
				oParentNode.aoChildren.push(oChildNode);
				this.fnSetData(oChildNode,oChildData);
			}
		}
		
	},
	fnSetRootData:function(oRootData) {
		this.oRootNode={
			sHtmlId:this.eTable.getAttribute('id')+'_Node',
			nDepth:0,
			oData:oRootData,
			bIsLast:true,
			oParent:null
		};
		this.fnSetData(this.oRootNode, oRootData);
	},
	fnVisitNode:function(oNode, fnVisitor, oContext) {
		var aoResult=[];
		var oResult=fnVisitor.call(this, oNode, oContext);
		if (oResult !== undefined) {
			aoResult.push(oResult);
		}
		if (oNode.bHasChildren) {
			for(var childIndex=0;childIndex<oNode.aoChildren.length;childIndex++) {
				aoResult.concat(this.fnVisitNode(oNode.aoChildren[childIndex], fnVisitor, oContext));
			}
		}
		return aoResult;
	},
	fnVisitRootNode:function(fnVisitor, oContext) {
		this.fnVisitNode(this.oRootNode, fnVisitor, oContext);
	},
	fnAppendHeader:function() {
		// New Row
		var eHead=javasimon.DOMUtil.fnAppendChildElement(this.eTable,'thead');
		var eRow=javasimon.DOMUtil.fnAppendChildElement(eHead,'tr');
		var eCell,i;
		// Cells
		var aoColumns=this.oSettings.aoColumns;
		for(i=0;i<aoColumns.length;i++) {
			eCell=javasimon.DOMUtil.fnAppendChildElement(eRow,'td');	
			javasimon.DOMUtil.fnAppendChildText(eCell,aoColumns[i].sTitle);
		}
	},
	fnAppendImage:function(eParent,sType) {
		var eImg=javasimon.DOMUtil.fnAppendChildElement(eParent,'img');
		eImg.setAttribute('src',this.oSettings.oImages[sType]);
		return eImg;
	},
	fnGetNodePath:function(oNode) {
		var oCurrentNode=oNode;
		var aoNodes=[];
		while(oCurrentNode!==null) {
			aoNodes.push(oCurrentNode);
			oCurrentNode=oCurrentNode.oParent;
		}
		return aoNodes.reverse();
	},
	fnGetCellValue:function(oNode,oColumn,nColumnIndex) {
		return oNode.oData[oColumn.sField];
	},
	fnFillNodeCell:function(oNode,eCell,oColumn,nColumnIndex) {
		var sFieldValue=this.fnGetCellValue(oNode,oColumn,nColumnIndex);
		if (sFieldValue) {
			javasimon.DOMUtil.fnAppendChildText(eCell, sFieldValue);
		}
		if (oColumn.sClass) {
			javasimon.DOMUtil.fnAppendClass(eCell, oColumn.sClass);
		}
	},
	fnGetImageType:function(oNode) {
		var sImgType;
		if (oNode.bHasChildren) {
			sImgType =  oNode.bIsLast?'lastNode':'node';
			sImgType += oNode.bExpanded?'Expanded':'Collapsed';
		} else {
			sImgType =  oNode.bIsLast?'lastLeaf':'leaf';
		}
		return sImgType;
	},
	fnAppendNode:function(oNode, oContext) {
		// New Row
		var eRow=javasimon.DOMUtil.fnAppendChildElement(this.eTableBody,'tr');
		eRow.setAttribute('id',oNode.sHtmlId);
		oNode.eRow=eRow;
		// New Header Cell
		var eCell=javasimon.DOMUtil.fnAppendChildElement(eRow,'td');	
		javasimon.DOMUtil.fnAppendClass(eCell, 'headCell');
		// Prepare tree node
		var aoPathNodes=this.fnGetNodePath(oNode.oParent);
		var oDataTreeTable=this;
		var bVisible=true;
		var eImg,sImgType;
		var i;
		var aoColumns=this.oSettings.aoColumns;
		for(i=0;i<aoPathNodes.length;i++) {
			var oPathNode=aoPathNodes[i];
			if (oPathNode.bIsLast) {
				this.fnAppendImage(eCell,'lastSpacer');
			} else {
				this.fnAppendImage(eCell,'spacer');
			}
			if (oPathNode.bExpanded===false) {
				bVisible=false;
			}
		}
		javasimon.DOMUtil.fnAppendClass(eRow, (bVisible?'visible':'hidden'));
		// Tree node images
		sImgType =  this.fnGetImageType(oNode);
		eImg=this.fnAppendImage(eCell,sImgType);
		if (oNode.bHasChildren) {
			eImg.onclick=function(){ 
				oDataTreeTable.fnToggleNodeExpanded(oNode);
				return false;
			};
			oNode.eToggleImage=eImg;
		} 
		// Tree node label
		this.fnFillNodeCell(oNode,eCell,aoColumns[0] ,0);
		// Other columns
		for(i=1;i<aoColumns.length;i++) {
			eCell=javasimon.DOMUtil.fnAppendChildElement(eRow,'td');	
			this.fnFillNodeCell(oNode,eCell,aoColumns[i],i);
		}
	},
	fnAppend:function() {
		this.fnAppendHeader();
		this.eTableBody=javasimon.DOMUtil.fnAppendChildElement(this.eTable,'tbody');
		this.fnVisitRootNode(this.fnAppendNode, null);
	},
	fnToggleNodeExpanded:function(oNode) {
		var oContext;
		if (oNode.bHasChildren) {
			oNode.bExpanded = !oNode.bExpanded;
			oNode.eToggleImage.setAttribute('src',this.oSettings.oImages[this.fnGetImageType(oNode)]);
			oContext=oNode.bExpanded?
				{sOldClass:'hidden',	sNewClass:'visible'}:
				{sOldClass:'visible',	sNewClass:'hidden'};
			oContext.bFirst=true;
			this.fnVisitNode(oNode, function(poNode,poContext) {
				if (poContext.bFirst) {
					poContext.bFirst=false;
				} else {
					javasimon.DOMUtil.fnReplaceClass(poNode.eRow,poContext.sOldClass,poContext.sNewClass);
				}
			}, oContext);
			return false;
		} else {
			return true;
		}
	},
	fnFindNodeByHtmlId:function(sHtmlId) {
		function fnTestNodeByHtmlId(oNode, oContext) {
			if (oNode.sHtmlId===oContext.sHtmlId) {
				return oNode;
			}
		}
		return this.fnVisitRootNode(fnTestNodeByHtmlId, {sHtmlId: sHtmlId});
	}
};

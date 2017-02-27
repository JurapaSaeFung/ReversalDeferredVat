function tax_purchase(request, response){
    var params = request.getAllParameters();
        
    var context = nlapiGetContext();
    var userLoc = context.getUser();
    var userRole = context.getRole();
    var form = nlapiCreateForm('Reverse Deferred Input Vat');
    form.setScript('customscript_cs_reversal_defer_tax');
	
	var arrow = '';
    var checked = '';
    var ajax_queue = '';
    var ajaxloader = '';
    var use_subs = '';
    var use_bot = '';
    try{
        var bundleObj = nlapiLoadRecord('customrecord_bundle_info', 1);
        arrow = bundleObj.getFieldValue('custrecord_arrow');
        checked = bundleObj.getFieldValue('custrecord_checked');
        ajax_queue = bundleObj.getFieldValue('custrecord_ajax_queue');
        ajaxloader = bundleObj.getFieldValue('custrecord_ajaxloader');
        use_subs = bundleObj.getFieldValue('custrecord_use_subsidiary');
        use_bot = bundleObj.getFieldValue('custrecord_use_bot_exrate');
    }catch(e){
        var error = 'Unexpected Error';
        if(e != null && e.message != null){ error = e.message; }
        else if(e != null){ error = e.toString(); }
        nlapiLogExecution('ERROR', 'ERROR Message', error);
    }
	
    
	if(params['stepfield'] == null){
		var f_subsidiary = params['f_subsidiary'];
		nlapiLogExecution('error', 'log', f_subsidiary);
        var field = form.addField('stepfield', 'integer', '', '');
            field.setDefaultValue(1);
            field.setDisplayType('hidden');
		
		
        form.addFieldGroup('pridetail', 'Primary Detail').setSingleColumn(true);
		form.addFieldGroup('filterdetail', 'Filter').setSingleColumn(true);
		var Filters1 = new Array();
            Filters1[0] = new nlobjSearchFilter('country', null, 'is', 'TH');
			Filters1[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		var Columns = new Array();
            Columns[0] = new nlobjSearchColumn('name');
			// Columns[1] = new nlobjSearchColumn('appliestoservice');
		var ss_sub = nlapiSearchRecord('subsidiary', null, Filters1, Columns);
		var field = form.addField('f_subsidiary', 'select', 'Subsidiary', '', 'pridetail').setMandatory(true);
		for(var i=0; ss_sub != null && i<ss_sub.length; i++){
			field.addSelectOption(ss_sub[i].getId(), ss_sub[i].getValue('name'));
		}
		
		
        // var field = form.addField('f_subsidiary', 'select', 'Subsidiary', 'subsidiary', 'pridetail').setMandatory(true);
            if(f_subsidiary != null)field.setDefaultValue(f_subsidiary);
			
			if(use_subs != 'T'){ field.setDisplayType('hidden'); }
                
        var field = form.addField('f_account', 'select', 'Reverse From', '', 'pridetail').setMandatory(true);
		var Filters1 = new Array();
            Filters1[0] = new nlobjSearchFilter('country', null, 'is', 'TH');
			if(f_subsidiary != null && f_subsidiary != undefined)
				Filters1[1] = new nlobjSearchFilter('subsidiary', null, 'anyof', f_subsidiary);
		var Columns = new Array();
            Columns[0] = new nlobjSearchColumn('purchaseaccount');
			Columns[1] = new nlobjSearchColumn('appliestoservice');
		var ss_account = nlapiSearchRecord('salestaxitem', null, Filters1, Columns);
		var ss_account_ = [];
		for(var i=0; ss_account != null && i<ss_account.length; i++){
			var getAcc = ss_account[i].getValue('purchaseaccount');
			var getAccT = ss_account[i].getText('purchaseaccount');
			var app_ser = ss_account[i].getValue('appliestoservice');
			if(ss_account_.indexOf(getAcc) == -1 && app_ser == 'T'){
				field.addSelectOption(getAcc, getAccT);
				ss_account_.push(getAcc);
			}			
		}
		var field = form.addField('f_vendor', 'select', 'Vendor', 'vendor', 'filterdetail');
		var field = form.addField('f_location', 'multiselect', 'Location', 'location', 'filterdetail');
			  
        
		form.addSubmitButton('Submit');
	}
	else if(params['stepfield']==1){

        var field = form.addField('stepfield', 'integer', '', 'group');
            field.setDefaultValue(2);
            field.setDisplayType('hidden');
        // var date_create = params['date_create'];
        var f_subsidiary = params['f_subsidiary'];
        var f_location = params['f_location'];
        var deferred_acc = params['f_account'];
		var f_vendor = params['f_vendor'];
		
		var now = new Date();
            now = new Date(now.getTime() + 14 * 60 * 60 * 1000);// + เวลา Server
        var todate = nlapiDateToString(now, 'date');            

        var field = form.addField('f_subsidiary', 'select', 'Subsidiary', 'subsidiary');
            field.setDefaultValue(f_subsidiary);
            field.setDisplayType('inline');
            
        var field = form.addField('date_create','date','Revesal Date').setMandatory(true);
            field.setDefaultValue(todate);
            // field.setDisplayType('inline');
			
		var enddate = '';
        var Filters1 = new Array();
            Filters1[0] = new nlobjSearchFilter('aplocked', null, 'is', 'T');
            Filters1[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
        var Columns = new Array();
            Columns[0] = new nlobjSearchColumn('aplocked');
        var SS_chkAR = nlapiSearchRecord('accountingperiod', 'customsearch_check_accounting_period', Filters1, Columns);
        if(SS_chkAR != null){
            enddate = SS_chkAR[SS_chkAR.length-1].getValue('enddate');
        }
                
        var field = form.addField('f_aploked', 'text', 'A/P locked Period');
            field.setDefaultValue(enddate);
            field.setDisplayType('hidden');		
			
		
		var field = form.addField('deferred_acc', 'select', 'Reverse From', 'account');
			field.setDefaultValue(deferred_acc);
            field.setDisplayType('disabled');
                
        var Filters = new Array();
        var Columns = new Array();
            
            //Filters[0] = new nlobjSearchFilter('type', null, 'is', 'AcctPay');//Bank
            Filters[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
            Columns = new Array();
            Columns[0] = new nlobjSearchColumn('type');
            Columns[1] = new nlobjSearchColumn('name');
        var AccSearch = nlapiSearchRecord('account', null, Filters, Columns);
            
        var field = form.addField('f_account', 'select', 'Reverse To').setMandatory(true);
            //field.setDefaultValue(account_code);
                //field.setDisplayType('inline');
            field.addSelectOption('','');
        var Filters1 = new Array();
            Filters1[0] = new nlobjSearchFilter('country', null, 'is', 'TH');
			Filters1[1] = new nlobjSearchFilter('subsidiary', null, 'anyof', f_subsidiary);
			Filters1[2] = new nlobjSearchFilter('appliestoservice', null, 'is', 'F');
			Filters1[3] = new nlobjSearchFilter('isexcludetaxreports', null, 'is', 'F');
			Filters1[4] = new nlobjSearchFilter('exempt', null, 'is', 'F');
		var Columns = new Array();
            Columns[0] = new nlobjSearchColumn('purchaseaccount');
			Columns[1] = new nlobjSearchColumn('appliestoservice');
			Columns[1] = new nlobjSearchColumn('excludefromtaxreports');
			Columns[1] = new nlobjSearchColumn('exempt');
		var ss_account = nlapiSearchRecord('salestaxitem', null, Filters1, Columns);
		var ss_account_ = [];
		for(var i=0; ss_account != null && i<ss_account.length; i++){
			var getAcc = ss_account[i].getValue('purchaseaccount');
			var getAccT = ss_account[i].getText('purchaseaccount');
			var app_ser = ss_account[i].getValue('appliestoservice');
			var exempt = ss_account[i].getValue('excludefromtaxreports');
			var excl_tax = ss_account[i].getValue('exempt');
			if(ss_account_.indexOf(getAcc) == -1){
				field.addSelectOption(getAcc, getAccT);
				ss_account_.push(getAcc);
			}			
		} 

            var list2 = form.addSubList('list', 'list', 'List');
                field = list2.addField('selected','checkbox','Select');
				field.setDisplayType('disabled');
                // list2.addMarkAllButtons();
                field = list2.addField('date_tax','date','Tax Inv. Date').setMandatory(true);
                field.setDisplayType('entry');
                field = list2.addField('tax_no','text','Tax Inv. No.').setMandatory(true);
                field.setDisplayType('entry');
            var line = 1;
             
            var Filters = [];
                Filters.push(new nlobjSearchFilter('subsidiary', null, 'is', f_subsidiary));
                if(f_location != null && f_location != '')Filters.push(new nlobjSearchFilter('location', null, 'anyof', f_location));
				if(f_vendor != null && f_vendor != '')Filters.push(new nlobjSearchFilter('custcol_vendor_list', null, 'is', f_vendor));
			var Columns = [];
			Columns.push(new nlobjSearchColumn('aplocked', 'accountingPeriod'));
			Columns.push(new nlobjSearchColumn('allownonglchanges', 'accountingPeriod'));
			Columns.push(new nlobjSearchColumn('postingperiod'));
            // var ss_1 = nlapiSearchRecord('transaction','customsearch_ssb_reversal_defer_tax', Filters, Columns);//Filters1
			var ss_1 = new Array();
			var loadSearch = nlapiLoadSearch('transaction','customsearch_ssb_reversal_defer_tax');
			loadSearch.addColumns(Columns);
			
			loadSearch.addFilters(Filters);
			
			var  searchid = 0;
			var getData = loadSearch.runSearch();
			do {
				resultslice = getData.getResults(searchid, searchid + 1000);
				for ( var rs in resultslice) {
					ss_1.push(resultslice[rs]);
					searchid++;
				}
				// nlapiLogExecution('ERROR', 'LoadSearch', searchid);
				// if (searchid >= maxRecordPerTime - 1) break;
				// break;
			} while (resultslice.length >= 1000);
			
			
            
			var c = nlapiLoadSearch('transaction','customsearch_ssb_reversal_defer_tax');
			nlapiLogExecution('error', 'log--', c.columns.length);
			var thead = '<tr>' ;
                thead +=    '<td>No.</td>' ;
			for(var i=0; i<c.columns.length; i++){
				nlapiLogExecution('error', 'log--', c.columns[i].type+','+c.columns[i].searchtype);
				field = list2.addField(c.columns[i].name, c.columns[i].type, c.columns[i].label, c.columns[i].name);
				field.setDisplayType('inline');
				thead += '<td>'+c.columns[i].label+'</td>';
			}
			thead += '</tr>';
            var tbody = '';
			
			var hiddenfield = new Array();
			hiddenfield.push({name:'aplocked', type: 'text', label: 'aplocked', join: 'accountingPeriod', searchtype: null});
			hiddenfield.push({name:'allownonglchanges', type: 'text', label: 'allownonglchanges', join: 'accountingPeriod', searchtype: null});
			hiddenfield.push({name:'postingperiod', type: 'text', label: 'postingperiod', join: null, searchtype: null});
			
			for(var i=0; i<hiddenfield.length; i++){
				field = list2.addField(hiddenfield[i].name, hiddenfield[i].type, hiddenfield[i].label, hiddenfield[i].searchtype);
				
				field.setDisplayType('hidden');
			}
            for(var i=0; ss_1!=null && i<ss_1.length;i++){
				tbody += '<tr>';
				tbody += '<td>' + line + '</td>' ;
				for(var j=0; j<c.columns.length; j++){
					var fieldid = c.columns[j].name;
					var fieldtype = c.columns[j].type;
					var value = ss_1[i].getValue(fieldid);
					
					list2.setLineItemValue(fieldid, line, value);
					
                    if(fieldtype == 'select'){value = ss_1[i].getText(fieldid);}
					tbody += '<td>' + FT_Nullcheck(value) + '</td>' ;
					
					
				}
				
				// list2.setLineItemValue('aplocked', line, 'T');
				for(var j=0; j<hiddenfield.length-1; j++){
					var fieldid = hiddenfield[j].name;
					var fieldtype = hiddenfield[j].type;
					var fieldjoin= hiddenfield[j].join;
					var value = ss_1[i].getValue(fieldid, fieldjoin);
					
					if(fieldtype == 'select')value = ss_1[i].getText(fieldid, fieldjoin);
					
					list2.setLineItemValue(fieldid, line, value);
				}
				list2.setLineItemValue('postingperiod', line, ss_1[i].getText('postingperiod'));
				
				line++;
				tbody += '</tr>';
            }
			
            
          
        
        var tablename = "example";
        var Excel = '<div style="display:none">'+
                '<table cellpadding="0" cellspacing="0" border="0" id="example">' + thead + tbody +'</table></div >'+
        '<br><input id="exbutton" type="button" value=" Export Excel " onclick="CStableToExcel('+tablename+','+tablename+')">';
        
        var field = form.addField('_printexcel2', 'inlinehtml', ' ', null, null);
            field.setDefaultValue(Excel);
 
            
            form.addSubmitButton('Submit');
			form.addButton('backbtn', 'Back', 'window.location.href = \'' + nlapiResolveURL('suitelet', 'customscript_sl_reversal_defer_tax', 1) + '\';');
            form.addResetButton('Reset');
	}
	else if(params['stepfield']==2){
        
        var f_subsidiary = params['f_subsidiary'];
        var date_create = params['date_create'];
        var f_account = params['f_account'];
        var deferred_acc = params['deferred_acc'];
        var CountLine = request.getLineItemCount('list');

        var MyArray = [];
        var Entity = [];
        var Detail = '';
		var MyArray2 = [];
        var text = '';
        var bill_id = [];
		var amt_sum = 0, amt_tax_sum = 0, amt_total_sum = 0;
		var amt_sum2 = 0, amt_tax_sum2 = 0, amt_total_sum2 = 0;//For bill credit
		var f_location = '';
		var c = nlapiLoadSearch('transaction','customsearch_ssb_reversal_defer_tax');
        for(i = 1; i <= CountLine; i++){
            var is_selected = request.getLineItemValue('list', 'selected', i);
            if(is_selected == 'T'){
				var tax_inv_date = request.getLineItemValue('list', 'date_tax', i);
                var tax_no = request.getLineItemValue('list', 'tax_no', i);
				text = tax_inv_date+'^|^'+tax_no;
				for(var j=0; j<c.columns.length; j++){
					var fieldid = c.columns[j].name;
					var value = request.getLineItemValue('list', fieldid, i);
					text += '^|^'+value;
				}
				if(Detail == '' || Detail == null){
                    Detail = text;
                }else{
                    Detail = Detail+'--'+text;
                }

            }
        }
        var data_input = nlapiCreateRecord('customrecord_b_reversal_defer_tax');
		// var data_input = nlapiLoadRecord('customrecord_b_reversal_defer_tax', 14);
            data_input.setFieldValue('custrecord_defer_details', Detail);
            var input_id = nlapiSubmitRecord(data_input);
            
            MyArray.push({item: 'Loading..', id: f_subsidiary+'^!^'+input_id+'^!^'+''+'^!^'+date_create+'^!^'+f_account+'^!^'+deferred_acc});
		
        if(MyArray.length > 0){
                        //============ render data ===========
            display_trigger(form, arrow, checked, ajax_queue, ajaxloader, MyArray,'customscript_sl_reversal_defer_tax');
			// form.addButton('backbtn', 'Back', 'window.location.href = \'' + nlapiResolveURL('suitelet', 'customscript_sl_reversal_defer_tax', 1) + '\';');
            
            form.addSubmitButton('Submit');
        }
	}
	else if(params['stepfield']=='save'){
		// var values = params['values'];
		// nlapiLogExecution('error', 'log', params['stepfield']+'|'+values);
		create_journal(request, response);
		return;
	}
	response.writePage(form);
}
function create_journal(request, response){
	var context = nlapiGetContext();
	// var remaininingLog = context.getRemainingUsage();
		// nlapiLogExecution('error', 'remaininingLog', remaininingLog);
	
    var params = request.getAllParameters();
    var values = params['values'];
    var sub_values = String(values).split('^!^');
    
    var subsidiary = sub_values[0];
    var customid = sub_values[1];
    var data =  nlapiLookupField('customrecord_b_reversal_defer_tax', customid, 'custrecord_defer_details');
	nlapiLogExecution('error', 'log', data);
    var ArrRecord = data.split('--');
    var c = nlapiLoadSearch('transaction','customsearch_ssb_reversal_defer_tax');
	var obj = new Array();
	for(var j=0; j<c.columns.length; j++){
		obj[j] = new Array();
	}
	
    var location = sub_values[2];
    var date_create = sub_values[3];
    var acc_convert = sub_values[4];
	var deferred_acc = sub_values[5];
    
	
    var tax_inv_date = [];
    var tax_no = [];
    var ref_no = [];
	var doc_no = [];
    var amount = [];
    var amounttax = [];
    var transactionid = [];
    var vendor_name = [];
    var vendor_tax = [];
    var vendor_branch = [];
    var vendor_id = [];
	var vendor_address = [];
    var rec_jv = [];
	var location_ = [];
	var lineid = [];
	var rec_ype = [];
    var amount_sum = 0;
	
	var sep_transaction = new Object();
    // nlapiLogExecution('error', 'log1', ArrRecord.length);
    for(var xx = 0; xx < ArrRecord.length; xx++){
		var subdata = String(ArrRecord[xx]).split('^|^');
        tax_inv_date.push(subdata[0]);
        tax_no.push(subdata[1]);
		var index = '';
		for(var j=0; j<c.columns.length; j++){
			obj[j].push(subdata[j+2]);
			if(c.columns[j].name == 'taxamount'){amount_sum += Number(subdata[j+2]);}				
			
			if(c.columns[j].name == 'recordtype'){index = subdata[j+2];}
			if(c.columns[j].name == 'formulanumeric'){
				index += '|'+subdata[j+2];				
			}
		}
		if(sep_transaction[index] != undefined){
			sep_transaction[index].line.push(subdata[subdata.length-1]);
		}else{
			sep_transaction[index] = {
				id:subdata[subdata.length-2],
				type: subdata[subdata.length-3],
				line: [subdata[subdata.length-1]]
			};
		}
		
			
		
		
		ref_no.push(subdata[2]);
		doc_no.push(subdata[3]);
        // doc_date.push(subdata[4]);
        location_.push(subdata[5]);
        vendor_name.push(subdata[6]);
        vendor_tax.push(subdata[7]);
        vendor_branch.push(subdata[8]);
        amount.push(subdata[9]);
        amounttax.push(subdata[10]);
		var amountsum = subdata[11];
        // amount_sum += Number(subdata[10]);
        rec_ype.push(subdata[12]);
		transactionid.push(subdata[13]);
		lineid.push(subdata[14]);
		vendor_address.push('');
		
		// var index = subdata[12]+'|'+subdata[13];
		// if(sep_transaction[index] != undefined){
			// sep_transaction[index].line.push(subdata[14]);
		// }else{
			// sep_transaction[index] = {
				// id:subdata[13],
				// type: subdata[12],
				// line: [subdata[14]]
			// };
		// }
    }
	
	nlapiLogExecution('error', 'log2', amount_sum);
	nlapiLogExecution('error', 'sep_transaction', JSON.stringify(obj));
	// return;
	// var remaininingLog = context.getRemainingUsage();
		// nlapiLogExecution('error', 'remaininingLog', remaininingLog);
		
		var jv_obj = nlapiCreateRecord('customtransaction_reverse_def_input_va');
            if(subsidiary != null)jv_obj.setFieldValue('subsidiary',subsidiary);
            jv_obj.setFieldValue('trandate', date_create);
			// jv_obj.setFieldValue('approved','T');
			// jv_obj.setFieldValue('custbody_approval_status_journ','3');
            // jv_obj.setFieldValue('custbody_jv_journal_type', 4);/**Bank Transfer	1	Collection	2	General Journal	4	Payment	5*/
		
		var acc_debit2 = 110;//
		var acc_credit2 = deferred_acc;//Deferred Input Vat
//		
			jv_obj.selectNewLineItem('line');
			jv_obj.setCurrentLineItemValue('line','account',acc_credit2);
			jv_obj.setCurrentLineItemValue('line','credit',amount_sum.toFixed(9));
			jv_obj.commitLineItem('line');

		for(var j=0; j<ArrRecord.length; j++){
			// 
			jv_obj.selectNewLineItem('line');
			jv_obj.setCurrentLineItemValue('line','account',acc_convert);
			jv_obj.setCurrentLineItemValue('line','custcol_purchase_invoice_date',tax_inv_date[j]);//วันที่ใบกำกับภาษี
			jv_obj.setCurrentLineItemValue('line','custcol_purchase_invoice_no',tax_no[j]);//เลขที่ใบกำกับภาษี (column)
			for(var k=0; k<c.columns.length; k++){
				nlapiLogExecution('error', 'log3.1', 'j='+j+', k='+k+', c.columns[k].name='+c.columns[k].name);
				nlapiLogExecution('error', 'log3.1', 'c.columns[k].label='+c.columns[k].label+', obj[k][j]='+obj[k][j]);
				if(c.columns[k].name == 'taxamount'){
					jv_obj.setCurrentLineItemValue('line','debit', obj[k][j]);
				}else if(FT_Nullcheck(c.columns[k].label).toUpperCase() == 'AMOUNT'){
					jv_obj.setCurrentLineItemValue('line','custcol_base_amount_for_w_h', obj[k][j]);
				}else{
					jv_obj.setCurrentLineItemValue('line', c.columns[k].name , obj[k][j]);
				}
				
			}
			
			
			/* jv_obj.setCurrentLineItemValue('line','custcol_purchase_invoice_date',tax_inv_date[j]);//วันที่ใบกำกับภาษี
			jv_obj.setCurrentLineItemValue('line','custcol_purchase_invoice_no',tax_no[j]);//เลขที่ใบกำกับภาษี (column)
			jv_obj.setCurrentLineItemValue('line','custcol_tax_id_payee',vendor_tax[j]);//เลขประจำตัวผู้เสียภาษี (column)
			jv_obj.setCurrentLineItemText('line','custcol_vendor_list',vendor_name[j]);//ผู้ขายสินค้า/ผู้ให้บริการ
			jv_obj.setCurrentLineItemValue('line','custcol_purchaser_name',vendor_name[j]);//ผู้ขายสินค้า/ผู้ให้บริการ
			jv_obj.setCurrentLineItemValue('line','custentity_vendor_branch_name',vendor_branch[j]);//ฐานเงิน/มูลค่าสินค้า,บริการ (column)
			jv_obj.setCurrentLineItemValue('line','custcol_base_amount_for_w_h',amount[j]);//ฐานเงิน/มูลค่าสินค้า,บริการ (column)
			// jv_obj.setCurrentLineItemValue('line','custcol_payee_address',vendor_address[j]);//ที่อยู่ผู้ขายสินค้า/ผู้ให้บริการ (column
            jv_obj.setCurrentLineItemValue('line', 'location', location_[j]); */
			jv_obj.commitLineItem('line');
			// nlapiLogExecution('error', 'log3.2', j);
		}
		var jv_id = nlapiSubmitRecord(jv_obj);
		

		
        var jvno = nlapiLookupField('customtransaction_reverse_def_input_va', jv_id, 'tranid');
		
		
		
		for(var i in sep_transaction){
			
			var transaction = nlapiLoadRecord(sep_transaction[i].type, sep_transaction[i].id);
			
			
			var linecount = transaction.getLineItemCount('item');
			for(var j=1; j<=linecount; j++){
				var transactionline = transaction.getLineItemValue('item', 'line', j);
				if(sep_transaction[i].line.indexOf(transactionline) != -1){
					transaction.setLineItemValue('item','custcol_reverse_defer_input_vat_ref', j, jv_id);
				}				
			}
			
			var linecount = transaction.getLineItemCount('expense');
			for(var j=1; j<=linecount; j++){
				var transactionline = transaction.getLineItemValue('expense', 'line', j);
				if(sep_transaction[i].line.indexOf(transactionline) != -1){
					transaction.setLineItemValue('expense','custcol_reverse_defer_input_vat_ref', j, jv_id);
				}				
			}
			
			var linecount = transaction.getLineItemCount('line');
			for(var j=1; j<=linecount; j++){
				var transactionline = transaction.getLineItemValue('line', 'line', j);
				if(sep_transaction[i].line.indexOf(transactionline) != -1){
					transaction.setLineItemValue('line','custcol_reverse_defer_input_vat_ref', j, jv_id);
				}				
			}
			
			nlapiSubmitRecord(transaction, false, true);
		}
		response.write(jv_id+"^"+jvno);//"OK");
	
}

//==================== Trigger =============================//
function display_trigger(form, arrow, checked, ajax_queue, ajaxloader, data, script_id) {
	
    var html = '<style type="text/css">' +
            'div.button_wrapper' +
            '{' +
            '    float: center;' +
            '}' +
            'div.button_wrapper a' +
            '{' +
            '    display: block;' +
            '    height: 16px;' +
            '    width: 16px;' +
            '    background-position: center;' +
            '    background-repeat: no-repeat;' +
            '    background-image: url('+arrow+');' +//arrow
            '}' +
            'div.button_wrapper a.btdt' +
            '{' +
            '    background-image: url('+checked+');' +//checked
            '}' +
            'div.button_wrapper a:hover, div.button_wrapper a:active' +
            '{' +
            '    background-image: url('+arrow+');' +//arrow
            '}' +
            '</style>' +
'<script src="'+ajax_queue+'" type="text/javascript"></script>' +//ajax_queue.js
'<script type="text/javascript">' +
'var g_number_of_images = ' + data.length + ';' +
'function SetPhase0(in_id) {' +
'    document.getElementById(in_id + "_link").style.backgroundImage = "url('+ajaxloader+')";' +//ajaxloader.gif
'}' +
'function SetPhase4(in_id) {' +
'    var id = parseInt(in_id.substring(7));' +
'    document.getElementById(in_id + "_link").style.backgroundImage = "";' +
'}' +
'function NewBangOnAButton() {' +
'    var url = "/app/site/hosting/scriptlet.nl?script=' + script_id + '&deploy=1&method=new";' +
'    var eDate = new Date();' +
'    g_ajax_obj.CallXMLHTTPObjectGETParamPartial(url, NewSimpleCallback, "", "", eDate.getTime());' +
'}' +
'function NewSimpleCallback(in_text, in_param, in_param2) {}' +
'function UpdateBangOnAButton() {' +
'    var url = "/app/site/hosting/scriptlet.nl?script=' + script_id + '&deploy=1&method=update";' +
'    var eDate = new Date();' +
'    g_ajax_obj.CallXMLHTTPObjectGETParamPartial(url, UpdateSimpleCallback, "", "", eDate.getTime());' +
'}' +
'function UpdateSimpleCallback(in_text, in_param, in_param2) {document.getElementById("tbl_submitter").style.display = "";}' +
'function BangOnAButton(in_id) {' +
'    SetPhase0(in_id);' +
'    var _values = document.getElementById(in_id + "_id").value;' +
'    var url = "/app/site/hosting/scriptlet.nl?script=' + script_id + '&deploy=1&stepfield=save&values=" + _values;' +
'    var eDate = new Date();' +
'    g_ajax_obj.CallXMLHTTPObjectGETParamPartial(url, SimpleCallback, in_id, "", eDate.getTime());' +
'}' +
'function SimpleCallback(in_text, in_param, in_param2) {' +
'   try{ SetPhase4(in_param);' +
'    var substr = in_text.split("^");'+
'    if(substr.length == 2 && isNumber(parseInt(substr[0])))' +
'    {' +
'       var rec_id = substr[0];'+
'       var rec_no = substr[1];'+
'       document.getElementById(in_param + "_label").innerHTML = "OK";  '+
'       document.getElementById(in_param + "_Status").innerHTML = "<a href=\'/app/accounting/transactions/custom.nl?id="+rec_id+"&customtype=106\' target=\'_blank\'>Reverse Deferred Input Vat#"+rec_no+"</a>";  '+
'    }' +
'    else {' +
'         document.getElementById(in_param + "_Status").innerHTML = " Fail: "+in_text; ' +
'    }' +
'    if(in_param == "button_'+(data.length-1)+'")' +
'    {' +
'    var gotobatch = document.getElementById("gotobatch");gotobatch.style.display = "";' +
'    }}catch(e){alert(e.message);}' +
    //'    if (in_param == "button_' + (locations.length - 1) + '") {' +
    //'        alert("completed");' +
    //'    }' +
'}' +
'function Trigger_All() {' +
'    document.getElementById("tbl_submitter").style.display = "none";' +
//'    NewBangOnAButton();' +
'    for (var i = 0; i < g_number_of_images; i++) {' +
'        document.getElementById("button_" + i + "_Status").innerHTML = "";' +
'    }' +
'    for (var i = 0; i < g_number_of_images; i++) {' +
'        BangOnAButton("button_" + i);' +
'    }' +
//'    UpdateBangOnAButton();' +
'}' +
'</script>' +
            '<table style="table-layout: fixed;width:300px;" border="0" cellspacing="0" class="listtable listborder" cellpadding="0">' +
            '<tbody>' +
    //============= columns ================

            '<tr>' +
            '    <td align="center" class="listtext" width="30px"></td>' +
            '    <td align="center" class="listtext" width="300px">Title</td>' +
//            '    <td align="center" class="listtext" width="350px">DATA</td>' +
            '    <td align="center" class="listtext" width="220px">Status</td>' +
            '</tr>';
    //============= data ================
    for (var i = 0; data != null && i < data.length; i++) {
        html += '<tr>' +
                '    <td align="center" class="listtext"><input name="button_' + i + '_id" id="button_' + i + '_id" type="hidden" value="' + data[i].id + '">' +
                '	<div class="button_wrapper" class="listtext">' +
                '	    <a href="javascript:void(0)" id="button_' + i + '_link" class="dottedlink"></a>' +
                '	</div>' +
                '    </td>' +
                '    <td align="center" class="listtext" id="button_' + i + '_label">' + data[i].item +'</td>' +
//                '    <td align="center" class="listtext">' + data[i].id + '</td>' +
                '    <td align="center" class="listtext">' +
                '	<span id="button_' + i + '_Status" style="font-weight: bold;"></span>' +
                '    </td>' +
                '</tr>';
    }
    //=====================================
    html += '    </tbody>' +
            '</table><br>' +
    '<table border="0" cellspacing="0" cellpadding="0">' +
    '<tbody>' +
    '    <tr>' +
    '	<td style="">' +
    '	    <table id="tbl_custombutton1" cellpadding="0" cellspacing="0" border="0" style="margin-right: 6px;' +
    '		cursor: hand;">' +
    '		<tbody>' +
    '		    <tr id="tr_custombutton1" class="pgBntG">' +
    '			<td id="tdleftcap_custombutton1">' +
    '			    <img src="/images/nav/ns_x.gif" class="bntLT" border="0" height="50%" width="3"><img' +
    '				src="/images/nav/ns_x.gif" class="bntLB" border="0" height="50%" width="3">' +
    '			</td>' +
//    '			<td id="tdbody_custombutton1" height="20" valign="top" nowrap="" class="bntBgB">' +
//    '			    <input type="button" style="" class="rndbuttoninpt bntBgT" value="Refresh" onclick="Trigger_All();return false;">' +
//    '			</td>' +
    '			<td id="tdrightcap_custombutton1">' +
    '			    <img src="/images/nav/ns_x.gif" height="50%" class="bntRT" border="0" width="3"><img' +
    '				src="/images/nav/ns_x.gif" height="50%" class="bntRB" border="0" width="3">' +
    '			</td>' +
    '		    </tr>' +
    '		</tbody>' +
    '	    </table>' +
    '	</td>' +
    '    </tr>' +
    '</tbody>' +
    '</table>' +
   '<a id="gotobatch" style="display:none;" href="'+nlapiResolveURL('suitelet', 'customscript_sl_reversal_defer_tax', 1)+'" target=\'_blank\'> Back </a>'+
    '<script type="text/javascript">Trigger_All();</script>';

    var _group_data = form.addFieldGroup('_group_data', 'Data');
    var field = form.addField('custpage_trigger', 'inlinehtml', '', null, '_group_data');
    field.setDefaultValue(html);
    _group_data.setShowBorder(true);


    //form.addButton('custombutton1', 'Trigger', "Trigger_All()");

}



function defer_fieldChanged(type, name, linenum){
    if(name == 'date_create'){
        var f_aploked = FT_Nullcheck(nlapiGetFieldValue('f_aploked'));
        var f_date = FT_Nullcheck(nlapiGetFieldValue('date_create'));
        
        var date_arloked = nlapiStringToDate(f_aploked);
        var cur_date = date_arloked.getDate();
        var cur_month = date_arloked.getMonth() + 1;
        var cur_year = date_arloked.getFullYear();

        cur_date = Number(cur_date);
        cur_month = Number(cur_month);
        cur_year = Number(cur_year);

        var f_date = nlapiStringToDate(f_date);
        var f_dd = f_date.getDate();
        var f_mm = f_date.getMonth()+1;
        var f_yy = f_date.getFullYear();

        f_dd = Number(f_dd);
        f_mm = Number(f_mm);
        f_yy = Number(f_yy);
		if(f_date != ''){
			//ระบุวันที่ย้อนหลังไม่ได้ (แม้แต่วันเดียว แต่ทำล่วงหน้าได้)
			if(!((cur_year == f_yy && cur_month < f_mm) || cur_year < f_yy)){
			   alert('The transaction date you specified is not within the date range of your accounting period.');
			   nlapiSetFieldValue('date_create', '');
			}
		}        
    }
	if(name == 'f_subsidiary'){
		var stepfield = nlapiGetFieldValue('stepfield');
		var f_subsidiary = nlapiGetFieldValue('f_subsidiary');
		var f_vendor = nlapiGetFieldValue('f_vendor');
		var f_location = nlapiGetFieldValue('f_location');
		if(f_subsidiary != null){
			var url = nlapiResolveURL('suitelet', 'customscript_sl_reversal_defer_tax', 1);
			url += '&f_subsidiary='+f_subsidiary;
			url += '&f_vendor='+f_vendor;
			url += '&f_location='+f_location;
			
			window.location = url;
		}
		
	}
	
	if(name == 'date_tax' || name == 'tax_no'){
		var aplocked = FT_Nullcheck(nlapiGetLineItemValue('list', 'aplocked', linenum));
		var allglcha = FT_Nullcheck(nlapiGetLineItemValue('list', 'allownonglchanges', linenum));
		var postingperiodt = FT_Nullcheck(nlapiGetLineItemValue('list', 'postingperiodt', linenum));
		
		var tax_no = FT_Nullcheck(nlapiGetLineItemValue('list', 'tax_no', linenum));
		var date_tax = FT_Nullcheck(nlapiGetLineItemValue('list', 'date_tax', linenum));
		if(tax_no != '' || date_tax != ''){
			if(aplocked == 'T' && allglcha != 'T'){
				alert('Accounting Period of this Bill, '+postingperiodt+'.  Please contact your financial controller to set Allow Non GL Change option when closing accounting period.')
				nlapiSetLineItemValue('list', 'selected', linenum, 'F');
				nlapiSetLineItemValue('list', name, linenum, '');
			}else{
				nlapiSetLineItemValue('list', 'selected', linenum, 'T');
			}			
		}else{
			nlapiSetLineItemValue('list', 'selected', linenum, 'F');
		}
	}
}

function Defer_pageInit(){
	window.onbeforeunload = null;
}
function Defer_SaveRecord(){
    var step = nlapiGetFieldValue('stepfield');
	// alert(step);
    if(step == 2){
		
		var f_aploked = FT_Nullcheck(nlapiGetFieldValue('f_aploked'));
        var f_date = FT_Nullcheck(nlapiGetFieldValue('date_create'));
        
        var date_arloked = nlapiStringToDate(f_aploked);
        var cur_date = date_arloked.getDate();
        var cur_month = date_arloked.getMonth() + 1;
        var cur_year = date_arloked.getFullYear();

        cur_date = Number(cur_date);
        cur_month = Number(cur_month);
        cur_year = Number(cur_year);

        var f_date = nlapiStringToDate(f_date);
        var f_dd = f_date.getDate();
        var f_mm = f_date.getMonth()+1;
        var f_yy = f_date.getFullYear();

        f_dd = Number(f_dd);
        f_mm = Number(f_mm);
        f_yy = Number(f_yy);

		if(!((cur_year == f_yy && cur_month < f_mm) || cur_year < f_yy)){
            alert('The transaction date you specified is not within the date range of your accounting period.');
            return false;//nlapiSetFieldValue('date_create', ''));
        }
        var count_line = nlapiGetLineItemCount('list');
		
		var checkline = 0;
		var m_fields = '';
		var returnText = '';
		var invno = '';
		var invdate = '';

			
        for(var a = 1 ; a <= count_line; a++){
            var selected = nlapiGetLineItemValue('list', 'selected', a);
            
            var tax_no = FT_Nullcheck(nlapiGetLineItemValue('list', 'tax_no', a));
            var tax_date = FT_Nullcheck(nlapiGetLineItemValue('list', 'date_tax', a));
            if(selected == 'T'){
				checkline++;
				if(tax_no == ''){
					if(invno == '')invno = ''+a;
					else	invno+= ', '+a;			
				}
				if(tax_date == ''){
					if(invdate == '')invdate = ''+a;
					else	invdate+= ', '+a;	
				}
				
				// if(tax_date == '' && tax_no == ''){
					// invno++;
					// invdate++
					// alert('Please enter a value(s) for Tax Inv. Date, Tax Inv. No. ');
                    // return false;
				// }
				// else if(tax_date == '' || tax_date == null){					
                    // alert('Please enter a value for Tax Inv. Date');
                    // return false;
                // }
				// else if(tax_no == '' || tax_no == null){
					// alert('Please enter a value for Tax Inv. No.');
                    // return false;
				// }
                
            }
        }
		
		if(invdate != '' && invno != ''){
			alert('Please enter a value(s) for Tax Inv. Date in line '+invdate+'\n and Tax Inv. No. in line '+invno+'.');
			return false;
		}else if(invdate != ''){
			alert('Please enter a value(s) for Tax Inv. Date in line '+invdate+'.');
			return false;
		}
		else if(invno != ''){
			alert('Please enter a value(s) for Tax Inv. No. in line '+invno+'.');
			return false;
		}
		
		if(checkline<=0){
			alert('You must enter at least one line item for this transaction.');
			return false;
		}
        
    }
    return true;
    
}

function FT_Nullcheck(Varnullcheck){
    if (Varnullcheck == null || Varnullcheck == 'null' || Varnullcheck == '- None -')Varnullcheck = '';
    return Varnullcheck; 
}


function CStableToExcel(table, name){

    table = Redata(table);

    var uri = 'data:application/vnd.ms-excel;base64,'
	, template = '<?xml version="1.0"?>';
	  template += '<?mso-application progid="Excel.Sheet"?>';
	  template += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" ';
	  template += 'xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">';

        template += '<Worksheet ss:Name="InputVat">';
            template += '<Table>';
                template += GetExcelTable(table);
            template += '</Table>';
        template += '</Worksheet>';   

    template += '</Workbook>'

    , base64 = function(s) {return window.btoa(unescape(encodeURIComponent(s)));}
    , format = function(s, c) {return s.replace(/{(\w+)}/g, function(m, p) {return c[p];});};

    window.location.href = uri + base64(template);
}


function GetExcelTable(Txttable){
//    alert(Txttable);
    var result = '';
    
    var dataRow = Txttable.split('</tr>');
    if(Txttable == '')dataRow = [''];

    
    //----- Header
    result += '<Row>';
    var dataThCol = dataRow[0].split('</td>');
    for(var j = 0; j < dataThCol.length-1; j++){
        result += '<Cell><Data ss:Type="String">'+dataThCol[j]+'</Data></Cell>';
    }
    result += '</Row>';

    
    //----- Row
    for(var i = 1; i < dataRow.length-1; i++){//dataRow.length-1
        var dataCols = dataRow[i].split('</td>');
			
        result += '<Row>';
        for(var j = 0; j < dataCols.length-1; j++){
            if(j == 7 || j == 8)result += '<Cell><Data ss:Type="Number">'+dataCols[j]+'</Data></Cell>';
            else result += '<Cell><Data ss:Type="String">'+dataCols[j]+'</Data></Cell>';
        }
        result += '</Row>';
    }
    
//    alert(result);
    return result;
}

function TryParseFloat(str, defaultValue) {
    var retValue = defaultValue;
    if (str != null) {
        if (str.length > 0) {
            if (!isNaN(str)) {
                retValue = parseFloat(str);
            }
        }
    }
    return retValue;
}


function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function Redata(tableName){
    
    if (!tableName.nodeType) tableName = document.getElementById(tableName);
    var data = tableName.innerHTML;
    data = String(data).replace('<tbody>', '');
    data = String(data).replace('</tbody>', '');
    data = String(data).replace(/<tr>/g, '');
    data = String(data).replace(/<td>/g, '');

    return data;
}
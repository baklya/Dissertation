#define __STDC_FORMAT_MACROS


#include <boost/assign/std/vector.hpp>



#include <otf2/otf2.h>

#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <inttypes.h>

#include <iostream>
#include <fstream>
#include <string>
#include <vector>


#include "mongo/client/dbclient.h" // the mongo c++ driver

using namespace std;
using namespace mongo;
using namespace bson;


using namespace boost;
using namespace boost::assign;


//#define NOT_OUT_SENDS

ofstream out;




// TODO запоминаем данные о сенд в массив, при этом используем в качестве индекса массива номер получателя, при возникновении ресива, смотрим в массив, если там есть данные, смотрим чтоб они были корректными, если все хоршо, пишем их в бд


/// TODO сделать обработку SEND RECV, они могут возникать в одном регионе, для этого делаем массив флагов, запоминаем время входа в регион,
/// далее если произошло событие посылка прием, то флаг устанавливается в 1, и данные записываются в буфер
/// при выходе из региона смотрим на флаг, если он 1, то делаем запись в бд данных из буфера, обнуляем флаг.

//5911216808015  Receiver: 4 ("Master thread" <4>), Communicator: "" <1>, Tag: 83, Length: 1800

uint64_t NumProcesses; // количество процессов


vector<vector<long long int> > Point_SendTime; // время начала посылки - квадратная матрица, в каждый момент времени мы знаем информацию обо всех поставленных сендах
//long long int *Point_RecvTime;
vector<vector<int> > Point_SendComm; // коммуникатор у посылки
vector<vector<int> > Point_SendTag; // тег сообщения на посылке
vector<vector<long long int> > Point_SendLength; // длинa сообщения при посылке




uint64_t *BeginTimes; // время начала события


bool *IsPointEvent; // было ло событие точка-точка

bool *IsCommEvent; // было ло событие коллективное


int *RegionNames; // ссылка на имя региона

//int *SendTo; // кому посылка

long long int *SendLength; // сколько шлем

//int *RecvFrom; // от кого получаем

long long int *RecvLength; // сколько получили

int *Root; // root в коллективной операции


uint64_t startTime = 9999999999999;
uint64_t endTime = 0;

DBClientConnection DBConnection;
string TraceId;


uint32_t mainId;
uint32_t mpiId;

//uint32_t mpiParadigmId;


// Все строки
map<int, char*> STRINGS;

map<int, int> REGIONS;


//typedef tuple<int, int, long long int> t; // nameref, to , msglength

//vector<t> v;

OTF2_CallbackCode
print_global_def_string( void*          userData,
                         OTF2_StringRef self,
                         const char*    string )
{
	insert( STRINGS )
		(self, string);

	// Находим индекс строки main
	if(strcmp(string, "main") == 0){
		mainId = self;
		printf("main index: %u\n", self);
	}

	// Находим индекс строки ссылающейся на файл MPI
	if(strcmp(string, "MPI") == 0){
		mpiId = self;
		printf("MPI file index: %u\n", self);
	}

    return OTF2_CALLBACK_SUCCESS;
}
















OTF2_CallbackCode
print_global_def_region( void*           userData,
                         OTF2_RegionRef  self,
                         OTF2_StringRef  name,
                         OTF2_StringRef  canonicalName,
                         OTF2_StringRef  description,
                         OTF2_RegionRole regionRole,
                         OTF2_Paradigm   paradigm,
                         OTF2_RegionFlag regionFlags,
                         OTF2_StringRef  sourceFile,
                         uint32_t        beginLineNumber,
                         uint32_t        endLineNumber )
{


	if(name == mainId){
		
		printf("REGION NAME: %s source file: %s\n", STRINGS[name], STRINGS[sourceFile]);
		// по sourceFile находим путь к файлу
	}
    
    insert( REGIONS )
		(self, name);

	//printf("%u %s\n", paradigm, STRINGS[name]);

    return OTF2_CALLBACK_SUCCESS;
}















OTF2_CallbackCode EnterCallback(OTF2_LocationRef		location,
							      OTF2_TimeStamp		time,
							      void*					userData,
							      OTF2_AttributeList* 	attributeList,
							      OTF2_RegionRef		region)
{
	if(startTime > time)
	{
		startTime = (uint64_t) time;
	}


	BeginTimes[location] = time;
	//printf("REGION: %u\n", region);


    return OTF2_CALLBACK_SUCCESS;
}
OTF2_CallbackCode LeaveCallback(OTF2_LocationRef		location,
							      OTF2_TimeStamp		time,
							      void*					userData,
							      OTF2_AttributeList* 	attributeList,
							      OTF2_RegionRef		region)
{
	if(endTime < time)
	{
		endTime = (uint64_t) time;
	}


	if(IsPointEvent[location] == 1){

		// Делаем запись буфера в БД операций точка-точка

		//printf("%s: LOC:%u ", STRINGS[REGIONS[region]], location);


		long long int time1 = BeginTimes[location];
		long long int time2 = time;
		int loc1 = location;


		//int root1 = Root[location];
		//long long int ssen1 = SendLength[location];
		//long long int srecv1 = RecvLength[location];

		DBConnection.insert("Otf2Data.Events", BSON("TraceId" << TraceId << "TimeBegin" << time1 << "TimeEnd" << time2 << "Operation" << STRINGS[REGIONS[region]] << "Location" << loc1));

		/*

		if(SendLength[location] > 0 && RecvLength[location] > 0){
			printf("1\n");
			//cout << "TraceId " << TraceId << "TimeBegin " << BeginTimes[location] << "TimeEnd " << time << "Operation " << STRINGS[REGIONS[region]] << "Location " << location << "To " << SendTo[location] << "SizeSent " << SendLength[location] << "From " << RecvFrom[location] << "SizeReceived " << RecvLength[location] << endl;
			

			int to1 = SendTo[location];
			int from1 = RecvFrom[location];

			DBConnection.insert("Otf2Data.Events", BSON("TraceId" << TraceId << "TimeBegin" << time1 << "TimeEnd" << time2 << "Operation" << STRINGS[REGIONS[region]] << "Location" << loc1 << "To" << to1 << "SizeSent" << ssen1 << "From" << from1 << "SizeReceived" << srecv1));

			SendLength[location] = 0;
			RecvLength[location] = 0;
		}
		else{
			
			if(SendLength[location] > 0){
			//	printf("SEND_TO: %u SEND_LEN: %lu ",SendTo[location], SendLength[location]);
				int to1 = SendTo[location];
				DBConnection.insert("Otf2Data.Events", BSON("TraceId" << TraceId << "TimeBegin" << time1 << "TimeEnd" << time2 << "Operation" << STRINGS[REGIONS[region]] << "Location" << loc1 << "To" << to1 << "SizeSent" << ssen1));

				//cout << "TraceId " << TraceId << "TimeBegin " << BeginTimes[location] << "TimeEnd " << time << "Operation " << STRINGS[REGIONS[region]] << "Location " << location << "To " << SendTo[location] << "SizeSent " << SendLength[location] << endl;
				SendLength[location] = 0;
			}


			if(RecvLength[location] > 0){
				int from1 = RecvFrom[location];
				DBConnection.insert("Otf2Data.Events", BSON("TraceId" << TraceId << "TimeBegin" << time1 << "TimeEnd" << time2 << "Operation" << STRINGS[REGIONS[region]] << "Location" << loc1 << "From" << from1 << "SizeReceived" << srecv1));
				//cout << "TraceId " << TraceId << "TimeBegin " << BeginTimes[location] << "TimeEnd " << time << "Operation " << STRINGS[REGIONS[region]] << "Location " << location << "From " << RecvFrom[location] << "SizeReceived " << RecvLength[location] << endl;
			//	printf("RECV_FROM: %u RECV_LEN: %lu", RecvFrom[location], RecvLength[location]);


				RecvLength[location] = 0;
			}
		
		}
		*/

		//printf("\n");
		IsPointEvent[location] = 0;
	}




	if(IsCommEvent[location] == 1){

		long long int time1 = BeginTimes[location];
		long long int time2 = time;
		int loc1 = location;


		int root1 = Root[location];
		long long int ssen1 = SendLength[location];
		long long int srecv1 = RecvLength[location];
		
		if(Root[location] >= 0){
			DBConnection.insert("Otf2Data.Events", BSON("TraceId" << TraceId << "TimeBegin" << time1 << "TimeEnd" << time2 << "Operation" << STRINGS[REGIONS[region]] << "Location" << loc1 << "SizeSent" << ssen1 << "SizeReceived" << srecv1 << "Root" << root1));
			//DBConnection.insert("Otf2Data.Events", BSON("TraceId" << TraceId << "TimeBegin" << BeginTimes[location] << "TimeEnd" << time2 << "Operation" << STRINGS[REGIONS[region]] << "Location" << loc1 << "SizeSent" << SendLength[location] << "SizeReceived" << RecvLength[location] << "Root" << Root[location]));
			//cout << "TraceId " << TraceId << "TimeBegin " << BeginTimes[location] << "TimeEnd " << time << "Operation " << STRINGS[REGIONS[region]] << "Location " << location << "SizeSent " << SendLength[location] << "SizeReceived " << RecvLength[location] << "Root " << Root[location] << endl;
		}
		else{
			DBConnection.insert("Otf2Data.Events", BSON("TraceId" << TraceId << "TimeBegin" << time1 << "TimeEnd" << time2 << "Operation" << STRINGS[REGIONS[region]] << "Location" << loc1 << "SizeSent" << ssen1 << "SizeReceived" << srecv1));
			//cout << "TraceId " << TraceId << "TimeBegin " << BeginTimes[location] << "TimeEnd " << time << "Operation " << STRINGS[REGIONS[region]] << "Location " << location << "SizeSent " << SendLength[location] << "SizeReceived " << RecvLength[location] << endl;
		}
		


		IsCommEvent[location] = 0;
	}


    return OTF2_CALLBACK_SUCCESS;
}



OTF2_CallbackCode MPI_Send_print(OTF2_LocationRef 	location,
							     OTF2_TimeStamp 	time,
							     void 				*userData,
							     OTF2_AttributeList *attributeList,
							     uint32_t 			receiver,
							     OTF2_CommRef 		communicator,
							     uint32_t 			msgTag,
							     uint64_t 			msgLength)
{        


	IsPointEvent[location] = 1;


	long long int time1 = time;
	int loc1 = location;
	int targ1 = receiver;
	int comm1 = communicator;
	int tag1 = msgTag;
	long long int msglen1 = msgLength;


	if(targ1 > NumProcesses || targ1 < 0){
		printf("POPALSYA %u - %u\n", loc1, targ1);
	}

	Point_SendTime[NumProcesses * loc1 + targ1].push_back(time1);
	Point_SendComm[NumProcesses * loc1 + targ1].push_back(comm1);
	Point_SendTag[NumProcesses * loc1 + targ1].push_back(tag1);
	Point_SendLength[NumProcesses * loc1 + targ1].push_back(msglen1);

	

	
    return OTF2_CALLBACK_SUCCESS;
}









OTF2_CallbackCode MPI_Recv_print(OTF2_LocationRef 	location,
							     OTF2_TimeStamp 	time,
							     void 				*userData,
							     OTF2_AttributeList *attributeList,
							     uint32_t 			sender,
							     OTF2_CommRef 		communicator,
							     uint32_t 			msgTag,
							     uint64_t 			msgLength)
{        
	IsPointEvent[location] = 1;





	long long int time2 = time;
	int loc1 = location;
	int targ1 = sender;
	int comm1 = communicator;
	int tag1 = msgTag;
	long long int msglen1 = msgLength;


	//RecvFrom[location] = targ1;
	//RecvLength[location] = msglen1;



	// TODO смотрим очередь, если в ней есть элемент на соотв позиции, то вынимаем его, это будет нашим начальным временем, еси пусто, то какая-то ошибка
	if(Point_SendTime[NumProcesses * targ1 + loc1].size() > 0){


		bool chk = 1;

		for(int i = 0; i < Point_SendTime[NumProcesses * targ1 + loc1].size(); i++){

			if(Point_SendComm[NumProcesses * targ1 + loc1].at(i) == comm1 && Point_SendTag[NumProcesses * targ1 + loc1].at(i) == tag1 && Point_SendLength[NumProcesses * targ1 + loc1].at(i) == msglen1){
				long long int time1 = Point_SendTime[NumProcesses * targ1 + loc1].at(i);
				DBConnection.insert("Otf2Data.PointOperations", BSON("TraceId" << TraceId << "TimeBegin" << time1 << "TimeEnd" << time2  << "From" << targ1 << "To" << loc1 << "Size" << msglen1));
				

				Point_SendTime[NumProcesses * targ1 + loc1].erase(Point_SendTime[NumProcesses * targ1 + loc1].begin() + i);
				Point_SendComm[NumProcesses * targ1 + loc1].erase(Point_SendComm[NumProcesses * targ1 + loc1].begin() + i);
				Point_SendTag[NumProcesses * targ1 + loc1].erase(Point_SendTag[NumProcesses * targ1 + loc1].begin() + i);
				Point_SendLength[NumProcesses * targ1 + loc1].erase(Point_SendLength[NumProcesses * targ1 + loc1].begin() + i);

				chk = 0;

				break;
			}

	    }

	    if(chk){
	    	printf("WARNING\n");
	    }
	
	}
	//else{
	//	int sdsd = Point_SendTime[NumProcesses * targ1 + loc1].size();
	//	printf("Warning: recv before send %u - %u\n",loc1, sdsd);
	//}









    return OTF2_CALLBACK_SUCCESS;
}





OTF2_CallbackCode MPI_Irecv_print(OTF2_LocationRef 	location,
							     OTF2_TimeStamp 	time,
							     void 				*userData,
							     OTF2_AttributeList *attributeList,
							     uint32_t 			sender,
							     OTF2_CommRef 		communicator,
							     uint32_t 			msgTag,
							     uint64_t 			msgLength,
                 				 uint64_t            requestID )
{        
	IsPointEvent[location] = 1;




	long long int time2 = time;
	int loc1 = location;
	int targ1 = sender;
	int comm1 = communicator;
	int tag1 = msgTag;
	long long int msglen1 = msgLength;


	//RecvFrom[location] = targ1;
	//RecvLength[location] = msglen1;



	// TODO смотрим очередь, если в ней есть элемент на соотв позиции, то вынимаем его, это будет нашим начальным временем, еси пусто, то какая-то ошибка
	if(Point_SendTime[NumProcesses * targ1 + loc1].size() > 0){


		bool chk = 1;

		for(int i = 0; i < Point_SendTime[NumProcesses * targ1 + loc1].size(); i++){

			if(Point_SendComm[NumProcesses * targ1 + loc1].at(i) == comm1 && Point_SendTag[NumProcesses * targ1 + loc1].at(i) == tag1 && Point_SendLength[NumProcesses * targ1 + loc1].at(i) == msglen1){
				long long int time1 = Point_SendTime[NumProcesses * targ1 + loc1].at(i);
				DBConnection.insert("Otf2Data.PointOperations", BSON("TraceId" << TraceId << "TimeBegin" << time1 << "TimeEnd" << time2  << "From" << targ1 << "To" << loc1 << "Size" << msglen1));
				
				Point_SendTime[NumProcesses * targ1 + loc1].erase(Point_SendTime[NumProcesses * targ1 + loc1].begin() + i);
				Point_SendComm[NumProcesses * targ1 + loc1].erase(Point_SendComm[NumProcesses * targ1 + loc1].begin() + i);
				Point_SendTag[NumProcesses * targ1 + loc1].erase(Point_SendTag[NumProcesses * targ1 + loc1].begin() + i);
				Point_SendLength[NumProcesses * targ1 + loc1].erase(Point_SendLength[NumProcesses * targ1 + loc1].begin() + i);

				chk = 0;

				break;
			}

	    }

	    if(chk){
	    	printf("WARNING\n");
	    }
	
	}
	//else{
	//	int sdsd = Point_SendTime[NumProcesses * targ1 + loc1].size();
	//	printf("Warning: recv before send %u - %u\n",loc1, sdsd);
	//}













    return OTF2_CALLBACK_SUCCESS;
}











OTF2_CallbackCode MPI_Isend_print(OTF2_LocationRef		location,
							      OTF2_TimeStamp		time,
							      void*					userData,
							      OTF2_AttributeList* 	attributeList,
							      uint32_t				receiver,
							      OTF2_CommRef			communicator,
							      uint32_t				msgTag,
							      uint64_t				msgLength,
							      uint64_t				requestID)
{
	IsPointEvent[location] = 1;


	long long int time1 = time;
	int loc1 = location;
	int targ1 = receiver;
	int comm1 = communicator;
	int tag1 = msgTag;
	long long int msglen1 = msgLength;


	if(targ1 > NumProcesses || targ1 < 0){
		printf("POPALSYA %u - %u\n", loc1, targ1);
	}

	Point_SendTime[NumProcesses * loc1 + targ1].push_back(time1);
	Point_SendComm[NumProcesses * loc1 + targ1].push_back(comm1);
	Point_SendTag[NumProcesses * loc1 + targ1].push_back(tag1);
	Point_SendLength[NumProcesses * loc1 + targ1].push_back(msglen1);

	



    return OTF2_CALLBACK_SUCCESS;
}







OTF2_CallbackCode MPI_CollectiveEnd_print(OTF2_LocationRef		location,
										  OTF2_TimeStamp		time,
										  void*					userData,
										  OTF2_AttributeList 	*attributeList,
										  OTF2_CollectiveOp		collectiveOp,
										  OTF2_CommRef			communicator,
										  uint32_t				root,
										  uint64_t				sizeSent,
										  uint64_t				sizeReceived)
{
    OTF2_CollectiveOp_enum op = (OTF2_CollectiveOp_enum) collectiveOp;

    IsCommEvent[location] = 1;
    Root[location] = root;


    SendLength[location] = sizeSent;
    RecvLength[location] = sizeReceived;



    return OTF2_CALLBACK_SUCCESS;
}

OTF2_CallbackCode GlobDefLocation_Register(void*					userData,
										   OTF2_LocationRef			location,
										   OTF2_StringRef			name,
										   OTF2_LocationType		locationType,
										   uint64_t					numberOfEvents,
										   OTF2_LocationGroupRef	locationGroup)
{
    OTF2_Reader* reader = (OTF2_Reader*) userData;
    OTF2_EvtReader* evt_reader = OTF2_Reader_GetEvtReader(reader, location);
    OTF2_DefReader* def_reader = OTF2_Reader_GetDefReader(reader, location);

    uint64_t definitions_read = 0;
    OTF2_Reader_ReadAllLocalDefinitions(reader, def_reader, &definitions_read);
}

/*
// Здесь регистрируются все коммуникаторы, их можно использовать при изучении коллективных операций
OTF2_CallbackCode GlobDefCommunicator_Register(
	void* userData,
	OTF2_CommRef self,
	OTF2_StringRef name,
	OTF2_GroupRef group,
	OTF2_CommRef parent)
{
	printf("comm %u group %u parent %u found %d\n", self, group, parent, name);
}


// группы тоже важны наверно через них можно определить какие локации находятся в коммуникаторе
OTF2_CallbackCode GlobDefGroup_Register(
	void *userData,
	OTF2_GroupRef self,
	OTF2_StringRef name,
	OTF2_GroupType groupType,
	OTF2_Paradigm paradigm,
	OTF2_GroupFlag groupFlags,
	uint32_t numberOfMembers,
	const uint64_t *members)
{
	printf("Group %u found\n", self);
	printf("In this group %u members\n", numberOfMembers);
	
	return OTF2_CALLBACK_SUCCESS;
}*/

int main(int argc, char* argv[]) 
{


	Status status = client::initialize();
    if ( !status.isOK() ) {
        std::cout << "failed to initialize the mongo client driver: " << status.toString() << endl;
        return EXIT_FAILURE;
    }

    const char *port = "27017";

    try {
        cout << "connecting to localhost..." << endl;
        DBConnection.connect(string("localhost:") + port);
        cout << "connected ok" << endl;

		string tracePath;
		const char* defaultTracePath = "/home/vladimir/Desktop/kovcheg64-trace/traces.otf2";
		//const char* defaultTracePath = "/home/vladimir/Dicertation/otf2_trace/traces.otf2";
		//const char* defaultTracePath = "/home/vladimir/Desktop/qgen10-trace/traces.otf2";
		//const char* defaultTracePath = "/home/vladimir/tests/mpi_isend/scorep-20150416_1732_2789913328919/traces.otf2";

		if (argc != 2)
			tracePath = defaultTracePath;
		else
		{
			ifstream in;
			in.open(argv[1], ios::in);
			in >> tracePath;
			in.close();
		}

		OTF2_Reader* reader = OTF2_Reader_Open(tracePath.c_str());

		uint64_t tid_temp = 0; 
	    OTF2_Reader_GetTraceId (reader, &tid_temp);

	    // get procs number TODO
	    uint64_t numProcesses = 0;
	    OTF2_Reader_GetNumberOfLocations(reader, &numProcesses);

	    if ( numProcesses == 0 ) {
	        std::cout << "Something wrong with processes number" << endl;
	        return EXIT_FAILURE;
	    }

	    NumProcesses = numProcesses;

	    BeginTimes = new uint64_t[numProcesses];

	    for(int i = 0; i < numProcesses; i++){
	    	BeginTimes[i] = 0;
	    }

	   // SendTo = new int[numProcesses];

	    //for(int i = 0; i < numProcesses; i++){
	    //	SendTo[i] = -1;
	    //}


	    SendLength = new long long int[numProcesses];

	    for(int i = 0; i < numProcesses; i++){
	    	SendLength[i] = 0;
	    }

	    //RecvFrom = new int[numProcesses];

	    //for(int i = 0; i < numProcesses; i++){
	    //	RecvFrom[i] = -1;
	    //}

	    RecvLength = new long long int[numProcesses];

	    for(int i = 0; i < numProcesses; i++){
	    	RecvLength[i] = 0;
	    }

	    Root = new int[numProcesses];

	    for(int i = 0; i < numProcesses; i++){
	    	Root[i] = -1;
	    }

	    RegionNames = new int[numProcesses];
	    for(int i = 0; i < numProcesses; i++){
	    	RegionNames[i] = -1;
	    }

	    IsPointEvent = new bool[numProcesses];

	    for(int i = 0; i < numProcesses; i++){
	    	IsPointEvent[i] = 0;
	    }

	    IsCommEvent = new bool[numProcesses];

	    for(int i = 0; i < numProcesses; i++){
	    	IsCommEvent[i] = 0;
	    }





		//Point_SendTime = new long long int[numProcesses * numProcesses];
	    //for(int i = 0; i < numProcesses * numProcesses; i++){
	    //	Point_SendTime[i] = -1;
	    //}

	    //Point_SendTime = new long long int[numProcesses * numProcesses];
	    for(int i = 0; i < numProcesses * numProcesses; i++){
	    	//Point_SendTime[i] = -1;
	    	Point_SendTime.push_back(vector<long long int>());
	    }

	    for(int i = 0; i < numProcesses * numProcesses; i++){
	    	//Point_SendTime[i] = -1;
	    	Point_SendComm.push_back(vector<int>());
	    }

	    for(int i = 0; i < numProcesses * numProcesses; i++){
	    	//Point_SendTime[i] = -1;
	    	Point_SendTag.push_back(vector<int>());
	    }

	    for(int i = 0; i < numProcesses * numProcesses; i++){
	    	//Point_SendTime[i] = -1;
	    	Point_SendLength.push_back(vector<long long int>());
	    }






	    cout << tid_temp << endl;

	    char *buff;
	    buff = (char*) malloc (64);
	    sprintf(buff , "%" PRIx64, tid_temp);
		TraceId = string(buff);
		free(buff);

		auto_ptr<DBClientCursor> cursor = DBConnection.query("Otf2Data.TraceIds",  Query("{TraceId: \"" + TraceId + "\", Status: \"done\"}"));
		if(cursor->more()){
			cout << "Трасса с таким id уже сществует в БД" << endl;
		}
		else{
			DBConnection.remove("Otf2Data.Events", Query("{TraceId: \"" + TraceId + "\"}"));


			DBConnection.remove("Otf2Data.PointOperations", Query("{TraceId: \"" + TraceId + "\"}"));

			OTF2_GlobalDefReader* global_def_reader = OTF2_Reader_GetGlobalDefReader(reader);
			// creating global definition callbacks handle
			OTF2_GlobalDefReaderCallbacks* global_def_callbacks = OTF2_GlobalDefReaderCallbacks_New();
			// setting global definition reader callbacks to handle



			// получаем все строки
			OTF2_GlobalDefReaderCallbacks_SetStringCallback( global_def_callbacks, print_global_def_string );


			// получаем названия регионов 
			OTF2_GlobalDefReaderCallbacks_SetRegionCallback( global_def_callbacks, print_global_def_region );


			OTF2_GlobalDefReaderCallbacks_SetLocationCallback(global_def_callbacks, &GlobDefLocation_Register);

			//OTF2_GlobalDefReaderCallbacks_SetCommCallback (global_def_callbacks, &GlobDefCommunicator_Register);
			//OTF2_GlobalDefReaderCallbacks_SetGroupCallback(global_def_callbacks, &GlobDefGroup_Register);
			// registering callbacks and deleting callbacks handle
			OTF2_Reader_RegisterGlobalDefCallbacks(reader, global_def_reader, global_def_callbacks, reader);
			OTF2_GlobalDefReaderCallbacks_Delete( global_def_callbacks );

			// reading all global definitions
			uint64_t definitions_read = 0;
			OTF2_Reader_ReadAllGlobalDefinitions( reader, global_def_reader, &definitions_read );
			printf("Definitions_read = %"PRIu64"\n", definitions_read);
			
			// DEFINITIONS READING END
			
			cout << "numProcesses = " << numProcesses << endl; 


			// EVENTS READING START
			
			OTF2_GlobalEvtReader* global_evt_reader = OTF2_Reader_GetGlobalEvtReader(reader);
			// creating global event callbacks handle
			OTF2_GlobalEvtReaderCallbacks* event_callbacks = OTF2_GlobalEvtReaderCallbacks_New();
			// setting global event reader callbacks to handle

			OTF2_GlobalEvtReaderCallbacks_SetEnterCallback( event_callbacks, &EnterCallback);
			OTF2_GlobalEvtReaderCallbacks_SetLeaveCallback( event_callbacks, &LeaveCallback);

			
			OTF2_GlobalEvtReaderCallbacks_SetMpiSendCallback(event_callbacks, &MPI_Send_print);
			OTF2_GlobalEvtReaderCallbacks_SetMpiIsendCallback(event_callbacks, &MPI_Isend_print);



			OTF2_GlobalEvtReaderCallbacks_SetMpiRecvCallback(event_callbacks, &MPI_Recv_print);
			OTF2_GlobalEvtReaderCallbacks_SetMpiIrecvCallback(event_callbacks, &MPI_Irecv_print);



			//OTF2_GlobalEvtReaderCallbacks_SetMpiCollectiveBeginCallback(event_callbacks, &MPI_CollectiveBegin_print);

			OTF2_GlobalEvtReaderCallbacks_SetMpiCollectiveEndCallback(event_callbacks, &MPI_CollectiveEnd_print);

			
			// registering callbacks and deleting callbacks handle
			OTF2_Reader_RegisterGlobalEvtCallbacks(reader, global_evt_reader, event_callbacks, NULL);
			OTF2_GlobalEvtReaderCallbacks_Delete(event_callbacks);

			// reading all global events
			uint64_t events_read = 0;
			OTF2_Reader_ReadAllGlobalEvents(reader, global_evt_reader, &events_read);
			//printf("Events_read = %"PRIu64"\n", events_read);
			

			OTF2_Reader_Close( reader );

			cout << "Events started at " << startTime << endl;
			cout << "Events ended at " << endTime << endl;

			long long int num1 = numProcesses;

			DBConnection.insert("Otf2Data.TraceIds", BSON( "TraceId" << TraceId << "Status" << "done" << "NumberOfLocations" << num1));

			cout << "getlasterror returns: \"" << DBConnection.getLastError() << '"' << endl;

			cout << "Inserting successfully done! " << endl;
		}



		delete [] BeginTimes;
		delete [] IsPointEvent;

		delete [] IsCommEvent;

		delete [] RegionNames;
		//delete [] SendTo;
		//delete [] RecvFrom;

		delete [] SendLength;
		delete [] RecvLength;
		delete [] Root;

		//delete [] Point_SendTime;
		//delete [] Point_SendComm;
		//delete [] Point_SendTag;
		//delete [] Point_SendLength;


		
    } 
    catch(DBException& e) { 
        cout << "caught DBException " << e.toString() << endl;
        return EXIT_FAILURE;
    }






	return EXIT_SUCCESS;
}

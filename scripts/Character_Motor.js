// JavaScript source code
#pragma strict
#pragma implicit
#pragma downcast

// Does this script currently respond to input?
var canControl : boolean = true;

var useFixedUpdate : boolean = true;

// For the next variables, @System.NonSerialized tells Unity to not serialize the variable or show it in the inspector view.
// Very handy for organization!

// The current global direction we want the character to move in.
@System.NonSerialized
var inputMoveDirection : Vector3 = Vector3.zero;

// Is the jump button held down? We use this interface instead of checking
// for the jump button directly so this script can also be used by AIs.
@System.NonSerialized
var inputJump : boolean = false;

class CharacterMotorMovement {
    // The maximum horizontal speed when moving
    var maxForwardSpeed : float = 10.0;
    var maxSidewaysSpeed : float = 10.0;
    var maxBackwardsSpeed : float = 10.0;
	
    // Curve for multiplying speed based on slope (negative = downwards)
    var slopeSpeedMultiplier : AnimationCurve = AnimationCurve(Keyframe(-90, 1), Keyframe(0, 1), Keyframe(90, 0));
	
    // How fast does the character change speeds?  Higher is faster.
    var maxGroundAcceleration : float = 30.0;
    var maxAirAcceleration : float = 20.0;

    // The gravity for the character
    var gravity : float = 10.0;
    var maxFallSpeed : float = 20.0;
	
    // For the next variables, @System.NonSerialized tells Unity to not serialize the variable or show it in the inspector view.
    // Very handy for organization!

    // The last collision flags returned from controller.Move
	@System.NonSerialized
    var collisionFlags : CollisionFlags; 

    // We will keep track of the character's current velocity,
	@System.NonSerialized
    var velocity : Vector3;
	
    // This keeps track of our current velocity while we're not grounded
	@System.NonSerialized
    var frameVelocity : Vector3 = Vector3.zero;
	
	@System.NonSerialized
    var hitPoint : Vector3 = Vector3.zero;
	
	@System.NonSerialized
    var lastHitPoint : Vector3 = Vector3(Mathf.Infinity, 0, 0);
}

var movement : CharacterMotorMovement = CharacterMotorMovement();

enum MovementTransferOnJump {
    None, // The jump is not affected by velocity of floor at all.
	InitTransfer, // Jump gets its initial velocity from the floor, then gradualy comes to a stop.
	PermaTransfer, // Jump gets its initial velocity from the floor, and keeps that velocity until landing.
	PermaLocked // Jump is relative to the movement of the last touched floor and will move together with that floor.
}

// We will contain all the jumping related variables in one helper class for clarity.
class CharacterMotorJumping {
    // Can the character jump?
    var enabled : boolean = true;

    // How high do we jump when pressing jump and letting go immediately
    var baseHeight : float = 1.0;
	
    // We add extraHeight units (meters) on top when holding the button down longer while jumping
    var extraHeight : float = 4.1;
	
    // How much does the character jump out perpendicular to the surface on walkable surfaces?
    // 0 means a fully vertical jump and 1 means fully perpendicular.
    var perpAmount : float = 0.0;
	
    // How much does the character jump out perpendicular to the surface on too steep surfaces?
    // 0 means a fully vertical jump and 1 means fully perpendicular.
    var steepPerpAmount : float = 0.5;
	
    // For the next variables, @System.NonSerialized tells Unity to not serialize the variable or show it in the inspector view.
    // Very handy for organization!

    // Are we jumping? (Initiated with jump button and not grounded yet)
    // To see if we are just in the air (initiated by jumping OR falling) see the grounded variable.
	@System.NonSerialized
    var jumping : boolean = false;
	
	@System.NonSerialized
    var holdingJumpButton : boolean = false;

    // the time we jumped at (Used to determine for how long to apply extra jump power after jumping.)
	@System.NonSerialized
    var lastStartTime : float = 0.0;
	
	@System.NonSerialized
    var lastButtonDownTime : float = -100;
	
	@System.NonSerialized
    var jumpDir : Vector3 = Vector3.up;
}

class CharacterMotorMovingPlatform {
    var enabled : boolean = true;
	
    var movementTransfer : MovementTransferOnJump = MovementTransferOnJump.PermaTransfer;
	
	@System.NonSerialized
    var hitPlatform : Transform;
	
	@System.NonSerialized
    var activePlatform : Transform;
	
	@System.NonSerialized
    var activeLocalPoint : Vector3;
	
	@System.NonSerialized
    var activeGlobalPoint : Vector3;
	
	@System.NonSerialized
    var activeLocalRotation : Quaternion;
	
	@System.NonSerialized
    var activeGlobalRotation : Quaternion;
	
	@System.NonSerialized
    var lastMatrix : Matrix4x4;
	
	@System.NonSerialized
    var platformVelocity : Vector3;
	
	@System.NonSerialized
    var newPlatform : boolean;
}

var movingPlatform : CharacterMotorMovingPlatform = CharacterMotorMovingPlatform();

class CharacterMotorSliding {
    // Does the character slide on too steep surfaces?
    var enabled : boolean = true;
	
    // How fast does the character slide on steep surfaces?
    var slidingSpeed : float = 15;
	
    // How much can the player control the sliding direction?
    // If the value is 0.5 the player can slide sideways with half the speed of the downwards sliding speed.
    var sidewaysControl : float = 1.0;
	
    // How much can the player influence the sliding speed?
    // If the value is 0.5 the player can speed the sliding up to 150% or slow it down to 50%.
    var speedControl : float = 0.4;
}

var sliding : CharacterMotorSliding = CharacterMotorSliding();

@System.NonSerialized
var grounded : boolean = true;

@System.NonSerialized
var groundNormal : Vector3 = Vector3.zero;

private var lastGroundNormal : Vector3 = Vector3.zero;

private var tr : Transform;

private var controller : CharacterController;

function Awake () {
    controller = GetComponent (CharacterController);
    tr = transform;
}

private function UpdateFunction () {
    // We copy the actual velocity into a temporary variable that we can manipulate.
    var velocity : Vector3 = movement.velocity;
	
    // Update velocity based on input
    velocity = ApplyInputVelocityChange(velocity);
	
    // Apply gravity and jumping force
    velocity = ApplyGravityAndJumping (velocity);
	
    // Moving platform support
    var moveDistance : Vector3 = Vector3.zero;
    if (MoveWithPlatform()) {
        var newGlobalPoint : Vector3 = movingPlatform.activePlatform.TransformPoint(movingPlatform.activeLocalPoint);
        moveDistance = (newGlobalPoint - movingPlatform.activeGlobalPoint);
        if (moveDistance != Vector3.zero)
            controller.Move(moveDistance);
		
        // Support moving platform rotation as well:
        var newGlobalRotation : Quaternion = movingPlatform.activePlatform.rotation * movingPlatform.activeLocalRotation;
        var rotationDiff : Quaternion = newGlobalRotation * Quaternion.Inverse(movingPlatform.activeGlobalRotation);
        
        var yRotation = rotationDiff.eulerAngles.y;
        if (yRotation != 0) {
            // Prevent rotation of the local up vector
            tr.Rotate(0, yRotation, 0);
        }
    }
    // Save lastPosition for velocity calculation.
    var lastPosition : Vector3 = tr.position;
	
    // We always want the movement to be framerate independent.  Multiplying by Time.deltaTime does this.
    var currentMovementOffset : Vector3 = velocity * Time.deltaTime;
	
    // Find out how much we need to push towards the ground to avoid loosing grouning
    // when walking down a step or over a sharp change in slope.
    var pushDownOffset : float = Mathf.Max(controller.stepOffset, Vector3(currentMovementOffset.x, 0, currentMovementOffset.z).magnitude);
    if (grounded)
        currentMovementOffset -= pushDownOffset * Vector3.up;
	
    // Reset variables that will be set by collision function
    movingPlatform.hitPlatform = null;
    groundNormal = Vector3.zero;
	
    // Move our character!
    movement.collisionFlags = controller.Move (currentMovementOffset);
	
    movement.lastHitPoint = movement.hitPoint;
    lastGroundNormal = groundNormal;
	
    if (movingPlatform.enabled && movingPlatform.activePlatform != movingPlatform.hitPlatform) {
        if (movingPlatform.hitPlatform != null) {
            movingPlatform.activePlatform = movingPlatform.hitPlatform;
            movingPlatform.lastMatrix = movingPlatform.hitPlatform.localToWorldMatrix;
            movingPlatform.newPlatform = true;
        }
    }
	
    // Calculate the velocity based on the current and previous position.  
    // This means our velocity will only be the amount the character actually moved as a result of collisions.
    var oldHVelocity : Vector3 = new Vector3(velocity.x, 0, velocity.z);
    movement.velocity = (tr.position - lastPosition) / Time.deltaTime;
    var newHVelocity : Vector3 = new Vector3(movement.velocity.x, 0, movement.velocity.z);
	
    // The CharacterController can be moved in unwanted directions when colliding with things.
    // We want to prevent this from influencing the recorded velocity.
    if (oldHVelocity == Vector3.zero) {
        movement.velocity = new Vector3(0, movement.velocity.y, 0);
    }
    else {
        var projectedNewVelocity : float = Vector3.Dot(newHVelocity, oldHVelocity) / oldHVelocity.sqrMagnitude;
        movement.velocity = oldHVelocity * Mathf.Clamp01(projectedNewVelocity) + movement.velocity.y * Vector3.up;
    }
	
    if (movement.velocity.y < velocity.y - 0.001) {
        if (movement.velocity.y < 0) {
            // Something is forcing the CharacterController down faster than it should.
            // Ignore this
            movement.velocity.y = velocity.y;
        }
        else {
            // The upwards movement of the CharacterController has been blocked.
            // This is treated like a ceiling collision - stop further jumping here.
            jumping.holdingJumpButton = false;
        }
    }
	
    // We were grounded but just loosed grounding
    if (grounded && !IsGroundedTest()) {
        grounded = false;
		
        // Apply inertia from platform
        if (movingPlatform.enabled &&
			(movingPlatform.movementTransfer == MovementTransferOnJump.InitTransfer ||
			movingPlatform.movementTransfer == MovementTransferOnJump.PermaTransfer)
		) {
            movement.frameVelocity = movingPlatform.platformVelocity;
            movement.velocity += movingPlatform.platformVelocity;
        }
		
        SendMessage("OnFall", SendMessageOptions.DontRequireReceiver);
        // We pushed the character down to ensure it would stay on the ground if there was any.
        // But there wasn't so now we cancel the downwards offset to make the fall smoother.
        tr.position += pushDownOffset * Vector3.up;
    }
        // We were not grounded but just landed on something
    else if (!grounded && IsGroundedTest()) {
        grounded = true;
        jumping.jumping = false;
        SubtractNewPlatformVelocity();
		
        SendMessage("OnLand", SendMessageOptions.DontRequireReceiver);
    }
	
    // Moving platforms support
    if (MoveWithPlatform()) {
        // Use the center of the lower half sphere of the capsule as reference point.
        // This works best when the character is standing on moving tilting platforms. 
        movingPlatform.activeGlobalPoint = tr.position + Vector3.up * (controller.center.y - controller.height*0.5 + controller.radius);
        movingPlatform.activeLocalPoint = movingPlatform.activePlatform.InverseTransformPoint(movingPlatform.activeGlobalPoint);
		
        // Support moving platform rotation as well:
        movingPlatform.activeGlobalRotation = tr.rotation;
        movingPlatform.activeLocalRotation = Quaternion.Inverse(movingPlatform.activePlatform.rotation) * movingPlatform.activeGlobalRotation; 
    }
}

function FixedUpdate () {
    if (movingPlatform.enabled) {
        if (movingPlatform.activePlatform != null) {
            if (!movingPlatform.newPlatform) {
                var lastVelocity : Vector3 = movingPlatform.platformVelocity;
				
                movingPlatform.platformVelocity = (
					movingPlatform.activePlatform.localToWorldMatrix.MultiplyPoint3x4(movingPlatform.activeLocalPoint)
					- movingPlatform.lastMatrix.MultiplyPoint3x4(movingPlatform.activeLocalPoint)
				) / Time.deltaTime;
            }
            movingPlatform.lastMatrix = movingPlatform.activePlatform.localToWorldMatrix;
            movingPlatform.newPlatform = false;
        }
        else {
            movingPlatform.platformVelocity = Vector3.zero;	
        }
    }
	
    if (useFixedUpdate)
        UpdateFunction();
}

function Update () {
    if (!useFixedUpdate)
        UpdateFunction();
}

private function ApplyInputVelocityChange (velocity : Vector3) {	
    if (!canControl)
        inputMoveDirection = Vector3.zero;
	
    // Find desired velocity
    var desiredVelocity : Vector3;
    if (grounded && TooSteep()) {
        // The direction we're sliding in
        desiredVelocity = Vector3(groundNormal.x, 0, groundNormal.z).normalized;
        // Find the input movement direction projected onto the sliding direction
        var projectedMoveDir = Vector3.Project(inputMoveDirection, desiredVelocity);
        // Add the sliding direction, the spped control, and the sideways control vectors
        desiredVelocity = desiredVelocity + projectedMoveDir * sliding.speedControl + (inputMoveDirection - projectedMoveDir) * sliding.sidewaysControl;
        // Multiply with the sliding speed
        desiredVelocity *= sliding.slidingSpeed;
    }
    else
        desiredVelocity = GetDesiredHorizontalVelocity();
	
    if (movingPlatform.enabled && movingPlatform.movementTransfer == MovementTransferOnJump.PermaTransfer) {
        desiredVelocity += movement.frameVelocity;
        desiredVelocity.y = 0;
    }
	
    if (grounded)
        desiredVelocity = AdjustGroundVelocityToNormal(desiredVelocity, groundNormal);
    else
        velocity.y = 0;
	
    // Enforce max velocity change
    var maxVelocityChange : float = GetMaxAcceleration(grounded) * Time.deltaTime;
    var velocityChangeVector : Vector3 = (desiredVelocity - velocity);
    if (velocityChangeVector.sqrMagnitude > maxVelocityChange * maxVelocityChange) {
        velocityChangeVector = velocityChangeVector.normalized * maxVelocityChange;
    }
    // If we're in the air and don't have control, don't apply any velocity change at all.
    // If we're on the ground and don't have control we do apply it - it will correspond to friction.
    if (grounded || canControl)
        velocity += velocityChangeVector;
	
    if (grounded) {
        // When going uphill, the CharacterController will automatically move up by the needed amount.
        // Not moving it upwards manually prevent risk of lifting off from the ground.
        // When going downhill, DO move down manually, as gravity is not enough on steep hills.
        velocity.y = Mathf.Min(velocity.y, 0);
    }
	
    return velocity;
}
